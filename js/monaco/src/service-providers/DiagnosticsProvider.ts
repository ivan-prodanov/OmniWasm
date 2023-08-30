import { debounce, groupBy } from 'lodash';
import * as Monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import { CodeCheckRequestDto, CompilerWorkspace, LinePositionSpanTextChangeDto } from 'omniwasm';
import { MarkerData } from '..';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IDocumentUriEvent } from '../editors/EditorEvents';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import { IEditorWrapper } from '../editors/EditorWrapper';

export interface IEditorDiagnosticsChangeEvent {
    diagnostics: MarkerData[];
    fileUri: string | null;
}

export interface IDiagnosticsProvider {
    onDidFileChange: Monaco.IEvent<IDocumentUriEvent>;
    onDidDiagnosticsChange: Monaco.IEvent<IEditorDiagnosticsChangeEvent>;
}

export class DiagnosticsProvider extends DisposableWasmConsumer implements IDiagnosticsProvider {
    protected readonly _onDidDiagnosticsChange: Monaco.Emitter<IEditorDiagnosticsChangeEvent> = this._register(
        new Monaco.Emitter<IEditorDiagnosticsChangeEvent>()
    );

    public readonly onDidDiagnosticsChange: Monaco.IEvent<IEditorDiagnosticsChangeEvent> =
        this._onDidDiagnosticsChange.event;

    protected readonly _onDidFileChange: Monaco.Emitter<IDocumentUriEvent> = this._register(
        new Monaco.Emitter<IDocumentUriEvent>()
    );
    public readonly onDidFileChange: Monaco.IEvent<IDocumentUriEvent> = this._onDidFileChange.event;

    private readonly debouncedOnCodeCheckRequest = debounce(this.onCodeCheckRequest, 750);
    private readonly debouncedOnAllCodeCheckRequest = debounce(this.onCodeCheckRequest, 3000);

    constructor(
        server: CompilerWorkspace,
        private readonly uriConverter: IEditorUriConverter,
        private readonly monaco: typeof Monaco
    ) {
        super({ server });
    }

    public async onModelAdded(model: editor.ITextModel) {
        const codeCheckRequest: CodeCheckRequestDto = {
            fileName: model.uri.toString(),
        };

        this.debouncedOnAllCodeCheckRequest({ fileName: null });
    }

    public async onModelContentChanged(editor: IEditorWrapper, e: editor.IModelContentChangedEvent) {
        // false when the same file is opened in two editors at the same time and one changes the model content.
        // only the active editor should continue to minimize duplicate calls.
        // TODO Test this!
        //if (this.editorController.currentEditor == editor) {
        const documentUri = editor.activeDocumentUri;

        if (e.changes.length === 0) {
            // This callback fires with no changes when a document's state changes between "clean" and "dirty".
            return;
        }

        this._onDidFileChange.fire({
            fileUri: documentUri,
        });

        const lineChanges: LinePositionSpanTextChangeDto[] = e.changes.map((change) => {
            const range = change.range;
            return {
                newText: change.text,
                startLine: range.startLineNumber - 1,
                startColumn: range.startColumn - 1,
                endLine: range.endLineNumber - 1,
                endColumn: range.endColumn - 1,
            };
        });

        const fileChangeRequest = {
            applyChangesTogether: true,
            changes: lineChanges,
            fileName: documentUri,
        };

        await this._server.onFileChange(fileChangeRequest);

        const codeCheckRequest: CodeCheckRequestDto = {
            fileName: documentUri,
        };

        this.debouncedOnCodeCheckRequest(codeCheckRequest);
        this.debouncedOnAllCodeCheckRequest({ fileName: null });
        //}
    }

    private setModelMarkers(modelUri: string, markers: MarkerData[]) {
        const model = this.monaco.editor.getModel(this.monaco.Uri.parse(modelUri));
        if (model) {
            this.monaco.editor.setModelMarkers(model, modelUri, markers);
        }
    }

    private async onCodeCheckRequest(request: CodeCheckRequestDto) {
        const response = await this._server.onCodeCheckRequest(request);

        if (response !== undefined) {
            let modelDiagnostics = response.diagnostics.map<MarkerData>((d) => new MarkerData(d));

            if (request.fileName) {
                this.setModelMarkers(request.fileName, modelDiagnostics);
            } else {
                const fileUriMarkerGroups = groupBy(modelDiagnostics, (m) => m.fileUri);
                for (let fileUri in fileUriMarkerGroups) {
                    const modelMarkers = fileUriMarkerGroups[fileUri];
                    this.setModelMarkers(fileUri, modelMarkers);
                }
            }

            this._onDidDiagnosticsChange.fire({
                diagnostics: modelDiagnostics,
                fileUri: request.fileName,
            });
        }

        return response;
    }
}
