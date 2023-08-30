import * as Monaco from 'monaco-editor';
import { editor, IRange, StandaloneCodeEditorServiceImpl } from 'monaco-editor';
import { Disposable } from '../core/Disposable';
import { MarkerData } from '../event-handlers';
import { FileAttributes, IFileProvider } from '../workspaces';
import { ChangeStateRepository } from '../workspaces/ChangeStateRepository';
import EditorFile from '../workspaces/EditortFile';
import { IDocumentUriCancellableEvent, IDocumentUriEvent } from './EditorEvents';

export interface IEditorWrapper {
    editor: editor.IStandaloneCodeEditor;
    activeDocumentUri: string;
    closeCurrentDocument();
    openDocument(file: EditorFile);
    openDocumentUri(fileUri: string);
    closeDocument(file: EditorFile);
    getDocumentUri(fileUri: string);
    openDocumentAtLocation(fileUri: string, range: IRange);
    openDiagnostic(diagnostic: MarkerData);
    saveViewState(): boolean;
    onDidOpenDocument: Monaco.IEvent<IDocumentUriEvent>;
    onWillOpenDocument: Monaco.IEvent<IDocumentUriCancellableEvent>;
    onDidCloseDocument: Monaco.IEvent<IDocumentUriEvent>;
    onWillCloseDocument: Monaco.IEvent<IDocumentUriCancellableEvent>;
}

export class EditorWrapper extends Disposable implements IEditorWrapper {
    private readonly _files: string[] = [];
    private readonly editorChangeStateRepository: ChangeStateRepository = new ChangeStateRepository();

    protected readonly _onDidOpenDocument: Monaco.Emitter<IDocumentUriEvent> = this._register(
        new Monaco.Emitter<IDocumentUriEvent>()
    );
    public readonly onDidOpenDocument: Monaco.IEvent<IDocumentUriEvent> = this._onDidOpenDocument.event;

    protected readonly _onWillOpenDocument: Monaco.Emitter<IDocumentUriCancellableEvent> = this._register(
        new Monaco.Emitter<IDocumentUriCancellableEvent>()
    );
    public readonly onWillOpenDocument: Monaco.IEvent<IDocumentUriCancellableEvent> = this._onWillOpenDocument.event;

    protected readonly _onDidCloseDocument: Monaco.Emitter<IDocumentUriEvent> = this._register(
        new Monaco.Emitter<IDocumentUriEvent>()
    );
    public readonly onDidCloseDocument: Monaco.IEvent<IDocumentUriEvent> = this._onDidCloseDocument.event;

    protected readonly _onWillCloseDocument: Monaco.Emitter<IDocumentUriCancellableEvent> = this._register(
        new Monaco.Emitter<IDocumentUriCancellableEvent>()
    );
    public readonly onWillCloseDocument: Monaco.IEvent<IDocumentUriCancellableEvent> = this._onWillCloseDocument.event;

    constructor(
        private readonly _editor: editor.IStandaloneCodeEditor,
        private readonly monaco: typeof Monaco,
        private readonly fileProvider: IFileProvider,
        private readonly globalChangeStateRepository: ChangeStateRepository
    ) {
        super();
        //overrideCodeEditorService(monaco, _editor, globalChangeStateRepository);
        this.overrideOpenCodeEditor();
        this.overrideSetModel();

        this._register(_editor.onDidChangeModel((e) => this.onModelChanged(e)));
        this._register(this.monaco.editor.onWillDisposeModel((e) => this.onWillDisposeModel(e)));
    }

    get editor(): editor.IStandaloneCodeEditor {
        return this._editor;
    }

    get activeDocumentUri(): string {
        const uri = this._editor.getModel()?.uri;
        if (!uri) {
            throw new Error("There's no active document");
        }
        return uri.toString();
    }

    private onModelChanged(e: Monaco.editor.IModelChangedEvent) {
        if (e.oldModelUrl) {
            //const oldModelFile = this.uriConverter.toDocument(e.oldModelUrl);
        }

        if (e.newModelUrl) {
            const newModelFileUri = e.newModelUrl.toString();

            const file = this.fileProvider.getFile(newModelFileUri);
            const isReadOnly = file?.attributes === FileAttributes.ReadOnly;
            this._editor.updateOptions({ readOnly: isReadOnly });

            this._onDidOpenDocument.fire({ fileUri: newModelFileUri });
            this.editor.focus();

            const fileIndex = this._files.findIndex((x) => x === newModelFileUri);
            if (fileIndex !== -1) {
                this._files.splice(fileIndex, 1);
            }

            this._files.push(newModelFileUri);
        }
    }

    private onWillDisposeModel(model: Monaco.editor.IModel) {
        const modelUri = model.uri.toString();
        this.editorChangeStateRepository.removeChangeState(modelUri);
    }

    closeDocument(file: EditorFile) {
        const fileIndex = this._files.findIndex((x) => x === file.uri);
        let removed = false;
        const event: IDocumentUriCancellableEvent = {
            fileUri: file.uri,
            cancel: false,
        };
        this._onWillCloseDocument.fire(event);
        if (event.cancel) {
            return removed;
        }

        if (fileIndex !== -1) {
            this._files.splice(fileIndex, 1);
            this._onDidCloseDocument.fire({ fileUri: file.uri });
            removed = true;

            // If closing current document
            const model = this._editor.getModel();
            if (model?.uri.toString() === file.uri) {
                // If there are other tabs opened
                if (this._files.length > 0) {
                    const previousFileUri = this._files[this._files.length - 1];
                    this.openDocumentUri(previousFileUri);
                } else {
                    this._editor.setModel(null);
                }
            }
        }

        return removed;
    }

    openDocument(file: EditorFile) {
        return this.openDocumentUri(file.uri);
    }

    openDocumentUri(fileUri: string) {
        const uri = this.monaco.Uri.parse(fileUri);
        let model = this.monaco.editor.getModel(uri);
        if (model) {
            this._editor.setModel(model);
            this._editor.focus();
        }
    }

    getDocumentUri(fileUri: string) {
        const uri = this.monaco.Uri.parse(fileUri);
        return this.monaco.editor.getModel(uri);
    }

    openDocumentAtLocation(fileUri: string, range: IRange) {
        this.openDocumentUri(fileUri);
        this.editor.revealRangeInCenter({
            startLineNumber: range.startLineNumber,
            endLineNumber: range.endLineNumber,
            startColumn: range.startColumn,
            endColumn: range.endColumn,
        });
        this.editor.setPosition({
            lineNumber: range.startLineNumber,
            column: range.startColumn,
        });
        this.editor.setSelection({
            startLineNumber: range.startLineNumber,
            endLineNumber: range.endLineNumber,
            startColumn: range.startColumn,
            endColumn: range.endColumn,
        });

        this.editor.focus();
    }

    openDiagnostic(diagnostic: MarkerData) {
        this.openDocumentAtLocation(diagnostic.fileUri, diagnostic);
    }

    closeCurrentDocument() {
        this._editor.setModel(null); // TODO Should switch to previous tab
    }

    saveViewState(): boolean {
        let saved = false;
        const currentModel = this.editor.getModel();
        if (currentModel) {
            const modelUri = currentModel.uri.toString();
            const viewState = this.editor.saveViewState();
            if (viewState) {
                this.editorChangeStateRepository.setChangeState(modelUri, viewState);
                this.globalChangeStateRepository.setChangeState(modelUri, viewState);
                saved = true;
            }
        }

        return saved;
    }

    overrideOpenCodeEditor() {
        const editorService = (this.editor as any)._codeEditorService as StandaloneCodeEditorServiceImpl;
        const openEditorBase = editorService.openCodeEditor.bind(editorService);

        editorService.openCodeEditor = async (input, source) => {
            const result = await openEditorBase(input, source);
            if (result === null && source === this.editor) {
                this.editor.setModel(this.monaco.editor.getModel(input.resource));

                if (input.options) {
                    this.editor.revealRangeInCenterIfOutsideViewport({
                        startLineNumber: input.options.selection.startLineNumber,
                        endLineNumber: input.options.selection.endLineNumber,
                        startColumn: input.options.selection.startColumn,
                        endColumn: input.options.selection.endColumn,
                    });
                    this.editor.setPosition({
                        lineNumber: input.options.selection.startLineNumber,
                        column: input.options.selection.startColumn,
                    });
                } else {
                    console.error('options not set!~');
                }
            }
            return result; // always return the base result
        };
    }

    overrideSetModel() {
        const setModelBase = this.editor.setModel.bind(this.editor);

        this.editor.setModel = (model: Monaco.editor.ITextModel | null): void => {
            const event: IDocumentUriCancellableEvent = {
                fileUri: model?.uri.toString() ?? null,
                cancel: false,
            };

            this._onWillOpenDocument.fire(event);

            if (event.cancel) {
                return;
            }

            const oldModel = this.editor.getModel();
            if (oldModel) {
                const oldModelUri = oldModel.uri.toString();
                const viewState = this.editor.saveViewState();
                this.editorChangeStateRepository.setChangeState(oldModelUri, viewState);
                this.globalChangeStateRepository.setChangeState(oldModelUri, viewState);
            }

            setModelBase(model);
            const currentModel = this.editor.getModel();
            if (currentModel && currentModel !== oldModel) {
                const currentModelUri = currentModel.uri.toString();
                const newModelState =
                    this.editorChangeStateRepository.getChangeState(currentModelUri) ??
                    this.globalChangeStateRepository.getChangeState(currentModelUri);

                if (newModelState) {
                    this.editor.restoreViewState(newModelState);
                }
            }
        };
    }
}
