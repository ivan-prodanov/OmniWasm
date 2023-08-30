import * as Monaco from 'monaco-editor';
import { IDisposable } from 'monaco-editor';
import { AssemblyDto, CompilerWorkspace } from 'omniwasm';
import { Language } from '../constants/bootConstants';
import { Disposable } from '../core/Disposable';
import { EditorController, IEditorController } from '../editors/EditorController';
import { EditorUriConverter } from '../editors/EditorUriConverter';
import { EditorWrapperFactory, IEditorWrapperFactory } from '../editors/EditorWrapperFactory';
import { MarkerData } from '../event-handlers';
import {
    CodeActionsProvider,
    CodeLensProvider,
    CompletionProvider,
    DefinitionProvider,
    DocumentHighlightProvider,
    DocumentSymbolProvider,
    FoldingRangeProvider,
    HoverProvider,
    ImplementationsProvider,
    ReferencesProvider,
    RenameProvider,
    SemanticTokensProvider,
    SignatureProvider,
    SourceFormattingProvider,
} from '../service-providers';
import { CompilationProvider, ICompilationProvider } from '../service-providers/CompilationProvider';
import { DiagnosticsProvider, IDiagnosticsProvider } from '../service-providers/DiagnosticsProvider';
import { ChangeStateRepository } from './ChangeStateRepository';
import IFileProvider, { FileProvider } from './FileProvider';
import Project from './Project';
import { IProjectFactory, ProjectFactory } from './ProjectFactory';

export interface IWorkspace extends IDisposable {
    createProject(name: string, assemblyNames: AssemblyDto[]): Promise<Project>;
    removeProject(id: string): Promise<void>;
    editorController: IEditorController;
    projects: ReadonlyArray<Project>;
    diagnosticsProvider: IDiagnosticsProvider;
    compilationProvider: ICompilationProvider;
    editorWrapperFactory: IEditorWrapperFactory;
    fileProvider: IFileProvider;
}

export interface IMarkerChangedEvent {
    markers: MarkerData[];
    allFiles: boolean;
}

export default class Workspace extends Disposable implements IWorkspace {
    private readonly _projects: Project[] = [];
    private readonly _editorController: IEditorController;
    private readonly _projectFactory: IProjectFactory;
    private readonly _diagnosticsProvider: IDiagnosticsProvider;
    private readonly _editorWrapperFactory: EditorWrapperFactory;
    private readonly _fileProvider: IFileProvider;
    private readonly _compilationProvider: ICompilationProvider;

    constructor(monaco: typeof Monaco, private readonly wasmApi: CompilerWorkspace) {
        super();

        const uriConverter = new EditorUriConverter();
        const globalChangeStateRepository = new ChangeStateRepository();

        this._register(
            monaco.editor.onWillDisposeModel((e) => {
                const modelUri = e.uri.toString();
                globalChangeStateRepository.removeChangeState(modelUri);
            })
        );

        const diagnosticsProvider = this._register(new DiagnosticsProvider(wasmApi, uriConverter, monaco));
        this._diagnosticsProvider = diagnosticsProvider;

        const fileProvider = new FileProvider();
        this._fileProvider = fileProvider;

        this._editorWrapperFactory = new EditorWrapperFactory(monaco, this._fileProvider, globalChangeStateRepository);

        this._editorController = this._register(
            new EditorController(fileProvider, monaco, uriConverter, diagnosticsProvider)
        );

        this._projectFactory = new ProjectFactory(this._editorController, wasmApi, uriConverter);

        const omnisharpCompletionProvider = this._register(new CompletionProvider(wasmApi, uriConverter));

        const formattingProvider = this._register(new SourceFormattingProvider(wasmApi, uriConverter));

        const signatureProvider = this._register(new SignatureProvider(wasmApi, uriConverter));

        const documentSymbolProvider = this._register(new DocumentSymbolProvider(wasmApi, uriConverter));

        const semanticTokensProvider = this._register(new SemanticTokensProvider(wasmApi, uriConverter));

        const highlightProvider = this._register(new DocumentHighlightProvider(wasmApi, uriConverter));

        const hoverProvider = this._register(new HoverProvider(wasmApi, uriConverter));

        const codeActionsProvider = this._register(
            new CodeActionsProvider(wasmApi, this._editorController, uriConverter)
        );

        const renameProvider = this._register(new RenameProvider(wasmApi, this._editorController, uriConverter));
        const codeLensProvider = this._register(new CodeLensProvider(wasmApi, uriConverter, monaco));
        const referencesProvider = this._register(new ReferencesProvider(wasmApi, uriConverter, monaco));
        const implementationsProvider = this._register(new ImplementationsProvider(wasmApi, uriConverter, monaco));
        const foldingRangeProvider = this._register(new FoldingRangeProvider(wasmApi, uriConverter));
        const definitionProvider = this._register(new DefinitionProvider(wasmApi, monaco, uriConverter));

        this._compilationProvider = new CompilationProvider(wasmApi);

        // AutoComplete
        this._register(monaco.languages.registerCompletionItemProvider(Language, omnisharpCompletionProvider));

        // Format as user types
        this._register(monaco.languages.registerOnTypeFormattingEditProvider(Language, formattingProvider));

        // Format document segments.
        this._register(monaco.languages.registerDocumentRangeFormattingEditProvider(Language, formattingProvider));

        // Signature
        this._register(monaco.languages.registerSignatureHelpProvider(Language, signatureProvider));

        // Symbols
        this._register(monaco.languages.registerDocumentSymbolProvider(Language, documentSymbolProvider));

        // Semantic Tokens on Document
        this._register(monaco.languages.registerDocumentSemanticTokensProvider(Language, semanticTokensProvider));

        // Semantic Tokens on Range
        this._register(monaco.languages.registerDocumentRangeSemanticTokensProvider(Language, semanticTokensProvider));

        // Document Highlight (Find usages in file)
        this._register(monaco.languages.registerDocumentHighlightProvider(Language, highlightProvider));

        // Hover
        this._register(monaco.languages.registerHoverProvider(Language, hoverProvider));

        // Quick Fix
        this._register(monaco.languages.registerCodeActionProvider(Language, codeActionsProvider));

        // Rename
        this._register(monaco.languages.registerRenameProvider(Language, renameProvider));

        // CodeLens
        this._register(monaco.languages.registerCodeLensProvider(Language, codeLensProvider));

        // References
        this._register(monaco.languages.registerReferenceProvider(Language, referencesProvider));

        // Find Implementations
        this._register(monaco.languages.registerImplementationProvider(Language, implementationsProvider));

        // Folding blocks
        this._register(monaco.languages.registerFoldingRangeProvider(Language, foldingRangeProvider));

        // Go To Definition
        this._register(monaco.languages.registerDefinitionProvider(Language, definitionProvider));
    }

    get projects(): ReadonlyArray<Project> {
        return this._projects;
    }

    get editorController(): IEditorController {
        return this._editorController;
    }

    get editorWrapperFactory(): IEditorWrapperFactory {
        return this._editorWrapperFactory;
    }

    get fileProvider(): IFileProvider {
        return this._fileProvider;
    }

    async createProject(name: string, assemblyNames: AssemblyDto[]) {
        if (name.includes('/') || name.includes('\\')) {
            throw new Error('Invalid character in project name.');
        }

        const projectId = await this.wasmApi.createProject(name, assemblyNames);

        const project = this._projectFactory.create(name, projectId);
        this._projects.push(project);

        return project;
    }

    async removeProject(id: string) {
        await this.wasmApi.removeProject(id);

        const project = this._projects.find((p) => p.id === id);
        if (project) {
            const projectIndex = this._projects.indexOf(project);
            this._projects.splice(projectIndex, 1);
            project.files.forEach((f) => this.editorController.removeDocument(f));
            project.dispose();
        }
    }

    get diagnosticsProvider(): IDiagnosticsProvider {
        return this._diagnosticsProvider;
    }

    get compilationProvider(): ICompilationProvider {
        return this._compilationProvider;
    }
}
