import * as Monaco from 'monaco-editor';
import { CompositeDisposable } from '../core/CompositeDisposable';
import { Disposable } from '../core/Disposable';
import { DiagnosticsProvider } from '../service-providers/DiagnosticsProvider';
import EditorFile from '../workspaces/EditortFile';
import { FileProvider } from '../workspaces/FileProvider';
import { IDocumentEvent } from './EditorEvents';
import { IEditorUriConverter } from './EditorUriConverter';
import { IEditorWrapper } from './EditorWrapper';

export interface IEditorEvent {
    editor: IEditorWrapper;
}

export interface IEditorChangedEvent {
    editor: IEditorWrapper | null;
}

export interface IEditorFileChangeEvent {
    file: EditorFile;
}

export interface IEditorController {
    currentEditor: IEditorWrapper | null;

    addEditor(editor: IEditorWrapper, fileUri: string | null): IEditorWrapper;
    removeEditor(editor: IEditorWrapper): boolean;
    addDocument(file: EditorFile, language: string, code: string);
    removeDocument(file: EditorFile);

    onDidRemoveEditor: Monaco.IEvent<IEditorEvent>;
    onDidAddEditor: Monaco.IEvent<IEditorEvent>;
    onDidChangeCurrentEditor: Monaco.IEvent<IEditorChangedEvent>;
    onDidAddDocument: Monaco.IEvent<IDocumentEvent>;
    onDidRemoveDocument: Monaco.IEvent<IDocumentEvent>;
    getDocumentUriContent(fileUri: string): string | undefined;
    isModelChanged(fileUri: string): boolean;
}

export class EditorController extends Disposable implements IEditorController {
    private readonly _editors: Map<IEditorWrapper, Monaco.IDisposable> = new Map<IEditorWrapper, Monaco.IDisposable>();
    private _currentEditor: IEditorWrapper | null = null;

    protected readonly _onDidAddEditor: Monaco.Emitter<IEditorEvent> = this._register(
        new Monaco.Emitter<IEditorEvent>()
    );
    public readonly onDidAddEditor: Monaco.IEvent<IEditorEvent> = this._onDidAddEditor.event;

    protected readonly _onDidRemoveEditor: Monaco.Emitter<IEditorEvent> = this._register(
        new Monaco.Emitter<IEditorEvent>()
    );
    public readonly onDidRemoveEditor: Monaco.IEvent<IEditorEvent> = this._onDidRemoveEditor.event;

    protected readonly _onDidChangeCurrentEditor: Monaco.Emitter<IEditorChangedEvent> = this._register(
        new Monaco.Emitter<IEditorChangedEvent>()
    );
    public readonly onDidChangeCurrentEditor: Monaco.IEvent<IEditorChangedEvent> = this._onDidChangeCurrentEditor.event;

    protected readonly _onDidAddDocument: Monaco.Emitter<IDocumentEvent> = this._register(
        new Monaco.Emitter<IDocumentEvent>()
    );
    public readonly onDidAddDocument: Monaco.IEvent<IDocumentEvent> = this._onDidAddDocument.event;

    protected readonly _onDidRemoveDocument: Monaco.Emitter<IDocumentEvent> = this._register(
        new Monaco.Emitter<IDocumentEvent>()
    );
    public readonly onDidRemoveDocument: Monaco.IEvent<IDocumentEvent> = this._onDidRemoveDocument.event;

    constructor(
        private readonly fileProvider: FileProvider,
        private readonly monaco: typeof Monaco,
        private readonly uriConverter: IEditorUriConverter,
        private readonly diagnosticsProvider: DiagnosticsProvider
    ) {
        super();
    }

    getDocumentUriContent(fileUri: string): string | undefined {
        const model = this.monaco.editor.getModel(this.monaco.Uri.parse(fileUri));
        return model?.getValue();
    }

    get currentEditor(): IEditorWrapper | null {
        return this._currentEditor;
    }

    private changeCurrentEditor(currentEditor: IEditorWrapper | null) {
        if (this._currentEditor !== currentEditor) {
            this._currentEditor?.saveViewState();
            this._currentEditor = currentEditor;
            this._onDidChangeCurrentEditor.fire({ editor: currentEditor });
        }
    }

    addDocument(file: EditorFile, language: string, code: string) {
        const uri = this.uriConverter.fromFile(file);
        let model = this.monaco.editor.getModel(uri);
        if (!model) {
            model = this.monaco.editor.createModel(code, language, uri);
            const backupUri = this.uriConverter.toBackupUri(file.uri);
            this.monaco.editor.createModel(code, language, backupUri);
            this.diagnosticsProvider.onModelAdded(model);

            this.fileProvider.addFile(file);
            this._onDidAddDocument.fire({ file: file });
        }
    }

    removeDocument(file: EditorFile) {
        const model = this.monaco.editor.getModel(this.monaco.Uri.parse(file.uri));
        if (model) {
            model.dispose();

            this.fileProvider.removeFile(file.uri);

            this._onDidRemoveDocument.fire({ file: file });
        }
    }

    addEditor(wrapper: IEditorWrapper, fileUri: string | null): IEditorWrapper {
        // When opening an editor and there is already an editor ensure the global view state has data.
        // The newly open editor will benefit from this view state when e.g using Split View
        if (this.currentEditor) {
            this.currentEditor.saveViewState();
        }

        if (fileUri) {
            wrapper.openDocumentUri(fileUri);
        }

        const compositeDisposable = this._register(new CompositeDisposable());

        compositeDisposable.add(
            wrapper.editor.onDidChangeModelContent((e) => this.diagnosticsProvider.onModelContentChanged(wrapper, e))
        );

        // TODO should probably be like ^ above
        compositeDisposable.add(wrapper.editor.onDidFocusEditorText(() => this.changeCurrentEditor(wrapper)));

        this._editors.set(wrapper, compositeDisposable);
        this._onDidAddEditor.fire({ editor: wrapper });
        this.changeCurrentEditor(wrapper);

        return wrapper;
    }

    isModelChanged(fileUri: string) {
        const backupUri = this.uriConverter.toBackupUri(fileUri);
        const fileContent = this.getDocumentUriContent(fileUri);
        const backupContent = this.getDocumentUriContent(backupUri);

        return fileContent?.length !== backupContent?.length || fileContent !== backupContent;
    }

    removeEditor(editor: IEditorWrapper): boolean {
        const disposable = this._editors.get(editor);
        if (disposable) {
            this._editors.delete(editor);
            disposable.dispose();
            this._onDidRemoveEditor.fire({ editor: editor });

            const nextEditorPair = this._editors.entries().next().value;
            if (nextEditorPair) {
                const nextEditor = nextEditorPair[0] as IEditorWrapper;
                nextEditor.editor.focus();
                this.changeCurrentEditor(nextEditor);
            } else {
                this.changeCurrentEditor(null);
            }

            return true;
        }

        return false;
    }
}
