using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;
using Microsoft.Extensions.Logging;
using OmniSharp;
using OmniSharp.Abstractions.Services;
using OmniSharp.FileWatching;
using OmniSharp.Options;
using OmniSharp.Roslyn;
using OmniSharp.Roslyn.CSharp.Services;
using OmniSharp.Roslyn.CSharp.Services.Buffer;
using OmniSharp.Roslyn.CSharp.Services.CodeActions;
using OmniSharp.Roslyn.CSharp.Services.CodeCompilation;
using OmniSharp.Roslyn.CSharp.Services.Completion;
using OmniSharp.Roslyn.CSharp.Services.Decompilation;
using OmniSharp.Roslyn.CSharp.Services.Diagnostics;
using OmniSharp.Roslyn.CSharp.Services.Files;
using OmniSharp.Roslyn.CSharp.Services.Formatting;
using OmniSharp.Roslyn.CSharp.Services.Highlighting;
using OmniSharp.Roslyn.CSharp.Services.Navigation;
using OmniSharp.Roslyn.CSharp.Services.Refactoring;
using OmniSharp.Roslyn.CSharp.Services.Refactoring.V2;
using OmniSharp.Roslyn.CSharp.Services.SemanticHighlight;
using OmniSharp.Roslyn.CSharp.Services.Signatures;
using OmniSharp.Roslyn.CSharp.Services.Structure;
using OmniSharp.Roslyn.CSharp.Services.TestCommands;
using OmniSharp.Roslyn.CSharp.Services.Types;
using OmniSharp.Roslyn.CSharp.Workers.Diagnostics;
using OmniSharp.Roslyn.Options;
using OmniSharp.Services;
using OmniWasm.Boot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace OmniWasm
{
    public class OmniWasmApi : IDisposable
    {
        private bool _disposed;
        private readonly CsharpDiagnosticWorkerComposer _diagnosticWorkerComposer;
        private readonly static CSharpCompilationOptions _compilationOptions = new CSharpCompilationOptions(outputKind: OutputKind.DynamicallyLinkedLibrary, concurrentBuild: false);
        public readonly OmniSharpWorkspace _workspace;
        private readonly ILogger _logger;

        public OmniWasmApi(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<OmniWasmApi>();

            using var workspacePerformance = new PerformanceMonitor(loggerFactory, "Creating OmniSharpWorkspace", limitMs: 1000);
            var assemblyLoader = new AssemblyLoader(loggerFactory);

            var roslynFeatureHostServicesProvider = new RoslynFeaturesHostServicesProvider(assemblyLoader);
            var hostServiceProviders = new List<IHostServicesProvider>
            {
                roslynFeatureHostServicesProvider
            };

            var hostServiceAggregator = new HostServicesAggregator(hostServiceProviders, loggerFactory);
            var fileSystemWatcher = new NullFileSystemWatcher();
            _workspace = new OmniSharpWorkspace(hostServiceAggregator, loggerFactory, fileSystemWatcher);
            workspacePerformance.Dispose();

            using var optionsPerformance = new PerformanceMonitor(loggerFactory, "Setting up options", limitMs: 500);

            var omniSharpOptions = new OmniSharpOptions();

            var optionProviders = new List<IWorkspaceOptionsProvider>
            {
                new BlockStructureWorkspaceOptionsProvider(assemblyLoader),
                new CompletionOptionsProvider(),
                new CSharpFormattingWorkspaceOptionsProvider(),
                new ImplementTypeWorkspaceOptionsProvider(assemblyLoader),
                new RenameWorkspaceOptionsProvider(),
            }.OrderBy(p => p.Order);

            var environment = new WasmEnvironment();

            foreach (var optionProvider in optionProviders)
            {
                var optionSet = optionProvider.Process(_workspace.Options, omniSharpOptions, environment);
                var modifiedSolution = _workspace.CurrentSolution.WithOptions(optionSet);

                if (!_workspace.TryApplyChanges(modifiedSolution))
                {
                    _logger.LogWarning($"Couldn't apply options from workspace options provider: {optionProvider.GetType().Name}");
                }
            }

            optionsPerformance.Dispose();

            var codeActionProviders = new List<ICodeActionProvider>
            {
                new RoslynCodeActionProvider(roslynFeatureHostServicesProvider),
            };

            var eventEmitter = new NullEventEmitter(loggerFactory);
            var diagnosticEventForwarder = new DiagnosticEventForwarder(eventEmitter);
            var omniSharpOptionsMonitor = new NullOptionsMonitor<OmniSharpOptions>(omniSharpOptions);

            // TODO not sure if this is the right implementation of ICsDiagnosticWorker. There are two more implementations
            _diagnosticWorkerComposer = new CsharpDiagnosticWorkerComposer(_workspace, codeActionProviders, loggerFactory, diagnosticEventForwarder, omniSharpOptionsMonitor);

            var decompilationExternalSourceService = new DecompilationExternalSourceService(assemblyLoader, loggerFactory);
            var metadataExternalSourceService = new MetadataExternalSourceService(assemblyLoader);
            var externalSourceServiceFactory = new ExternalSourceServiceFactory(metadataExternalSourceService, decompilationExternalSourceService);

            var cachingCodeFixProviderForProjects = new CachingCodeFixProviderForProjects(loggerFactory, _workspace, codeActionProviders);

            var codeActionsHelper = new CodeActionHelper(assemblyLoader);

            // TODO this doesn't have any implementations. Test it
            var codeElementsPropertyProviders = new List<ICodeElementPropertyProvider>
            {

            };

            // TODO this doesn't have any implementations. Test it
            var syntaxFeatureDisocvers = new List<ISyntaxFeaturesDiscover>
            {

            };

            // TODO this doesn't have any implementations. Test it
            var testCommandProviders = new List<ITestCommandProvider>
            {

            };

            // Buffer
            ChangeBufferService = new ChangeBufferService(_workspace);
            UpdateBufferService = new UpdateBufferService(_workspace);

            // Completion
            CompletionService = new CompletionService(_workspace, omniSharpOptions.FormattingOptions, loggerFactory);

            // Diagnostics
            CodeCheckService = new CodeCheckService(_workspace, loggerFactory, omniSharpOptions, _diagnosticWorkerComposer);
            DiagnosticsService = new DiagnosticsService(diagnosticEventForwarder, _diagnosticWorkerComposer);
            ReanalyzeService = new ReAnalyzeService(_diagnosticWorkerComposer, _workspace, loggerFactory);

            // Files
            FileCloseService = new FileCloseService(_workspace);
            FileOpenService = new FileOpenService(_workspace);
            OnFilesChangedService = new OnFilesChangedService(fileSystemWatcher);

            // Formatting
            CodeFormatService = new CodeFormatService(_workspace, omniSharpOptions, loggerFactory);
            FormatAfterKeystrokeService = new FormatAfterKeystrokeService(_workspace, omniSharpOptions, loggerFactory);
            FormatRangeService = new FormatRangeService(_workspace, omniSharpOptions, loggerFactory);

            // Highlighting
            HighlightingService = new HighlightingService(_workspace);

            // Navigation
            FindImplementationsService = new FindImplementationsService(_workspace);
            FindSymbolsService = new FindSymbolsService(_workspace);
            FindUsagesService = new FindUsagesService(_workspace, loggerFactory);
            GotoDefinitionService = new GotoDefinitionService(_workspace, externalSourceServiceFactory, omniSharpOptions);
            GotoFileService = new GotoFileService(_workspace);
            GotoRegionService = new GotoRegionService(_workspace);
            MetadataService = new MetadataService(_workspace, externalSourceServiceFactory, omniSharpOptions);
            NavigationUpService = new NavigateUpService(_workspace);
            NavigationDownService = new NavigateDownService(_workspace);

            // Refactoring
            FixUsingService = new FixUsingService(_workspace, loggerFactory, assemblyLoader, codeActionProviders);
            GetCodeActionsService = new OmniSharp.Roslyn.CSharp.Services.Refactoring.GetCodeActionsService(_workspace, codeActionProviders);
            GetFixAllCodeActionService = new GetFixAllCodeActionService(_workspace, codeActionProviders, loggerFactory, _diagnosticWorkerComposer, cachingCodeFixProviderForProjects);
            RenameService = new RenameService(_workspace);
            RunCodeActionService = new RunCodeActionsService(_workspace, codeActionProviders);
            RunFixAllCodeActionService = new RunFixAllCodeActionService(_diagnosticWorkerComposer, codeActionProviders, cachingCodeFixProviderForProjects, _workspace, loggerFactory);

            // Refactoring V2
            GetCodeActionsServiceV2 = new OmniSharp.Roslyn.CSharp.Services.Refactoring.V2.GetCodeActionsService(_workspace, codeActionsHelper, codeActionProviders, loggerFactory, _diagnosticWorkerComposer, cachingCodeFixProviderForProjects);
            RunCodeActionServiceV2 = new RunCodeActionService(assemblyLoader, _workspace, codeActionsHelper, codeActionProviders, loggerFactory, _diagnosticWorkerComposer, cachingCodeFixProviderForProjects);

            // Semantic Highlight
            SemanticHighlightService = new SemanticHighlightService(_workspace, loggerFactory);

            // Signatures
            SignatureHelpService = new SignatureHelpService(_workspace);

            // Structure
            BlockStructureService = new BlockStructureService(assemblyLoader, _workspace);
            CodeStructureService = new CodeStructureService(_workspace, codeElementsPropertyProviders);
            MembersAsFlatService = new MembersAsFlatService(_workspace);
            MembersAsTreeService = new MembersAsTreeService(_workspace, syntaxFeatureDisocvers);

            // Test Commands
            TestCommandService = new TestCommandService(_workspace, testCommandProviders);

            // Types
            TypeLookupService = new TypeLookupService(_workspace, omniSharpOptions.FormattingOptions);

            QuickInfoProvider = new QuickInfoProvider(_workspace, omniSharpOptions.FormattingOptions, loggerFactory);

            // These aren't used by VS code
            //new ProjectInformationService();
            //new WorkspaceInformationService()

            CompilationService = new CompilationService(_workspace, omniSharpOptions, loggerFactory);
        }

        public ProjectId CreateProject(string projectName, MetadataReference[] references)
        {
            var projectInfo = ProjectInfo
                .Create(ProjectId.CreateNewId(), VersionStamp.Create(), projectName, assemblyName: projectName, LanguageNames.CSharp, compilationOptions: _compilationOptions)
                .WithMetadataReferences(references);

            _workspace.AddProject(projectInfo);

            return projectInfo.Id;
        }

        public void RemoveProject(ProjectId projectId)
        {
            _workspace.RemoveProject(projectId);
        }

        public DocumentId CreateFile(ProjectId projectId, ProjectFile projectFile)
        {
            var sourceText = SourceText.From(projectFile.Code, encoding: Encoding.UTF8);
            var textAndVersion = TextAndVersion.Create(sourceText, VersionStamp.Create());
            var textLoader = TextLoader.From(textAndVersion);

            var documentInfo = DocumentInfo.Create(
                id: DocumentId.CreateNewId(projectId), 
                name: projectFile.FileName,
                folders: null,
                sourceCodeKind: SourceCodeKind.Regular,
                loader: textLoader,
                filePath: projectFile.FileName, // TODO this last arg is not needed
                isGenerated: false
            );

            _workspace.AddDocument(documentInfo);

            return documentInfo.Id;
        }

        public CompletionService CompletionService { get; }
        public ChangeBufferService ChangeBufferService { get; }
        public UpdateBufferService UpdateBufferService { get; }
        public CodeCheckService CodeCheckService { get; }
        public DiagnosticsService DiagnosticsService { get; }
        public ReAnalyzeService ReanalyzeService { get; }
        public FileCloseService FileCloseService { get; }
        public FileOpenService FileOpenService { get; }
        public OnFilesChangedService OnFilesChangedService { get; }
        public CodeFormatService CodeFormatService { get; }
        public FormatAfterKeystrokeService FormatAfterKeystrokeService { get; }
        public FormatRangeService FormatRangeService { get; }
        public HighlightingService HighlightingService { get; }
        public FindImplementationsService FindImplementationsService { get; }
        public FindSymbolsService FindSymbolsService { get; }
        public FindUsagesService FindUsagesService { get; }
        public GotoDefinitionService GotoDefinitionService { get; }
        public GotoFileService GotoFileService { get; }
        public GotoRegionService GotoRegionService { get; }
        public MetadataService MetadataService { get; }
        public CompilationService CompilationService { get; }
        public NavigateUpService NavigationUpService { get; }
        public NavigateDownService NavigationDownService { get; }
        public FixUsingService FixUsingService { get; }
        public OmniSharp.Roslyn.CSharp.Services.Refactoring.GetCodeActionsService GetCodeActionsService { get; }
        public GetFixAllCodeActionService GetFixAllCodeActionService { get; }
        public RenameService RenameService { get; }
        public RunCodeActionsService RunCodeActionService { get; }
        public RunFixAllCodeActionService RunFixAllCodeActionService { get; }
        public OmniSharp.Roslyn.CSharp.Services.Refactoring.V2.GetCodeActionsService GetCodeActionsServiceV2 { get; }
        public RunCodeActionService RunCodeActionServiceV2 { get; }
        public SemanticHighlightService SemanticHighlightService { get; }
        public SignatureHelpService SignatureHelpService { get; }
        public BlockStructureService BlockStructureService { get; }
        public CodeStructureService CodeStructureService { get; }
        public MembersAsFlatService MembersAsFlatService { get; }
        public MembersAsTreeService MembersAsTreeService { get; }
        public TestCommandService TestCommandService { get; }
        public TypeLookupService TypeLookupService { get; }
        public QuickInfoProvider QuickInfoProvider { get; }

        public void Dispose() => Dispose(true);

        protected virtual void Dispose(bool disposing)
        {
            if (_disposed)
            {
                return;
            }

            if (disposing)
            {
                _diagnosticWorkerComposer.Dispose();
            }

            _disposed = true;
        }
    }
}
