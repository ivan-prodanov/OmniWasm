using Microsoft.Extensions.Logging;
using OmniSharp.Models.CodeCheck;
using OmniSharp.Models.Diagnostics;
using OmniWasm.Requests;
using System;
using System.Threading.Tasks;
using Wasm.Sdk;

namespace OmniWasm
{
    [Wasm]
    public class CompilerWorkspace : IDisposable
    {
        private bool _disposed = false;
        private ILoggerFactory _loggerFactory;
        private readonly ProjectSystem _projectSystem;
        private readonly OmniWasmApi _api;
        private readonly ILogger<CompilerWorkspace> _logger;

        static CompilerWorkspace()
        {
            // Initialize SQLite
            //SQLitePCL.Batteries.Init();
        }

        public CompilerWorkspace(string baseUri)
        {
            _loggerFactory = LoggerFactory.Create(builder =>
            {
#if DEBUG
                builder.SetMinimumLevel(LogLevel.Information);
#endif
                builder.AddProvider(new WebAssemblyConsoleLoggerProvider());
            });
            _logger = _loggerFactory.CreateLogger<CompilerWorkspace>();

            using (new PerformanceMonitor(_loggerFactory, $"Initializing {nameof(OmniWasmApi)}", limitMs: 1000))
            {
                _api = new OmniWasmApi(_loggerFactory);
                _projectSystem = new ProjectSystem(baseUri, _loggerFactory, _api);
            }
        }

        public Task<string> CreateProject(string projectName, AssemblyDto[] assemblyNames)
            => _projectSystem.CreateProject(projectName, assemblyNames);

        public void RemoveProject(string projectId) => _projectSystem.RemoveProject(projectId);

        public string CreateFile(string projectId, ProjectFile projectFile)
            => _projectSystem.CreateFile(projectId, projectFile);

        public async Task<bool> OnFileChange(ChangeBufferRequestDto changeBufferRequest)
        {
            var request = changeBufferRequest.ToUnderlyingObject();
            await _api.UpdateBufferService.Handle(request);
            _logger.LogDebug("OnFileChange");
            return true;
        }

        public async Task<CodeCheckResponseDto> OnCodeCheckRequest(CodeCheckRequestDto codeCheckRequest)
        {
            var result = await _api.CodeCheckService.Handle(new CodeCheckRequest { FileName = codeCheckRequest.FileName });
            _logger.LogDebug("OnCodeCheckRequest");
            return CodeCheckResponseDto.FromUnderlyingObject(result);
        }

        public async Task<CompletionResponseDto> OnCompletionRequest(CompletionRequestDto request)
        {
            var completion = await _api.CompletionService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnCompletionRequest");
            return CompletionResponseDto.FromUnderlyingObject(completion);
        }

        public async Task<CompletionResolveResponseDto> OnCompletionResolveRequest(CompletionResolveRequestDto request)
        {
            var completion = await _api.CompletionService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnCompletionResolveRequest");
            return CompletionResolveResponseDto.FromUnderlyingObject(completion);
        }

        public async Task<FormatRangeResponseDto> OnFormatAfterKeystrokeRequest(FormatAfterKeystrokeRequestDto request)
        {
            var result = await _api.FormatAfterKeystrokeService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnFormatAfterKeystrokeRequest");
            return FormatRangeResponseDto.FromUnderlyingObject(result);
        }

        public async Task<FormatRangeResponseDto> OnFormatRangeRequest(FormatRangeRequestDto request)
        {
            var result = await _api.FormatRangeService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnFormatRangeRequest");
            return FormatRangeResponseDto.FromUnderlyingObject(result);
        }

        public async Task<SignatureHelpResponseDto> OnSignatureHelpRequest(SignatureHelpRequestDto request)
        {
            var result = await _api.SignatureHelpService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnSignatureHelpRequest");
            return SignatureHelpResponseDto.FromUnderlyingObject(result);
        }

        public async Task<CodeStructureResponseDto> OnCodeStructureRequest(CodeStructureRequestDto request)
        {
            var result = await _api.CodeStructureService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnCodeStructureRequest");
            return CodeStructureResponseDto.FromUnderlyingObject(result);
        }

        public async Task<SemanticHighlightResponseDto> OnSemanticHighlightRequest(SemanticHighlightRequestDto request)
        {
            var result = await _api.SemanticHighlightService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnSemanticHighlightRequest");
            return SemanticHighlightResponseDto.FromUnderlyingObject(result);
        }

        public async Task<FindUsagesResponseDto> OnFindUsagesRequest(FindUsagesRequestDto request)
        {
            var result = await _api.FindUsagesService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnFindUsagesRequest");
            return FindUsagesResponseDto.FromUnderlyingObject(result);
        }

        public async Task<QuickInfoResponseDto> OnQuickInfoRequest(QuickInfoRequestDto request)
        {
            var result = await _api.QuickInfoProvider.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnQuickInfoRequest");
            return QuickInfoResponseDto.FromUnderlyingObject(result);
        }

        public async Task<GetCodeActionsResponseDto> OnGetCodeActionsRequest(GetCodeActionsRequestDto request)
        {
            var result = await _api.GetCodeActionsServiceV2.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnGetCodeActionsRequest");
            return GetCodeActionsResponseDto.FromUnderlyingObject(result);
        }

        public async Task<RunCodeActionResponseDto> OnRunCodeActionsRequest(RunCodeActionRequestDto request)
        {
            var result = await _api.RunCodeActionServiceV2.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnRunCodeActionsRequest");
            return RunCodeActionResponseDto.FromUnderlyingObject(result);
        }

        public async Task<RenameResponseDto> OnRenameRequest(RenameRequestDto request)
        {
            var result = await _api.RenameService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnRenameRequest");
            return RenameResponseDto.FromUnderlyingObject(result);
        }

        public async Task<FindImplementationsResponseDto> OnFindImplementationsRequest(FindImplementationsRequestDto request)
        {
            var result = await _api.FindImplementationsService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnFindImplementationsRequest");
            return FindImplementationsResponseDto.FromUnderlyingObject(result);
        }

        public async Task<BlockStructureResponseDto> OnBlockStructureRequest(BlockStructureRequestDto request)
        {
            var result = await _api.BlockStructureService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnBlockStructureRequest");
            return BlockStructureResponseDto.FromUnderlyingObject(result);
        }

        public async Task<GotoDefinitionResponseDto> OnGoToDefinitionRequest(GotoDefinitionRequestDto request)
        {
            var result = await _api.GotoDefinitionService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnGoToDefinitionRequest");
            return GotoDefinitionResponseDto.FromUnderlyingObject(result);
        }

        public async Task<MetadataResponseDto> OnMetadataRequest(MetadataRequestDto request)
        {
            var result = await _api.MetadataService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnGetMetadataRequest");
            return MetadataResponseDto.FromUnderlyingObject(result);
        }

        public async Task<CompilationResponseDto> OnCompilationRequest(CompilationRequestDto request)
        {
            var result = await _api.CompilationService.Handle(request.ToUnderlyingObject());
            _logger.LogDebug("OnCompilationRequest");

            return CompilationResponseDto.FromUnderlyingObject(result);
        }

        public void Dispose() => Dispose(true);

        protected virtual void Dispose(bool disposing)
        {
            _logger.LogInformation("Dispose() called.");
            if (_disposed)
            {
                return;
            }

            if (disposing)
            {
                // Dispose managed state (managed objects).
                _api.Dispose();
                _loggerFactory.Dispose();
            }

            _disposed = true;
        }
    }
}
