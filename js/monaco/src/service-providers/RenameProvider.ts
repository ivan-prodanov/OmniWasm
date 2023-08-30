import { CancellationToken, editor, languages, Position } from 'monaco-editor';
import { CompilerWorkspace, RenameRequestDto } from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorController } from '../editors';
import { IEditorUriConverter } from '../editors/EditorUriConverter';

export default class RenameProvider extends DisposableWasmConsumer implements languages.RenameProvider {
    constructor(
        server: CompilerWorkspace,
        private readonly editorController: IEditorController,
        private readonly uriConverter: IEditorUriConverter
    ) {
        super({ server });
    }

    async provideRenameEdits(
        model: editor.ITextModel,
        position: Position,
        newName: string,
        token: CancellationToken
    ): Promise<(languages.WorkspaceEdit & languages.Rejection) | undefined> {
        const currentEditor = this.editorController.currentEditor;
        if (this.uriConverter.isSolutionFile(model.uri) && currentEditor) {
            const fileName = model.uri.toString();
            let request: RenameRequestDto = {
                fileName: fileName,
                line: position.lineNumber - 1,
                column: position.column - 1,
                wantsTextChanges: true,
                applyTextChanges: false,
                renameTo: newName,
            };

            try {
                let response = await this._server.onRenameRequest(request);
                if (token.isCancellationRequested) {
                    return;
                }

                if (!response) {
                    return undefined;
                }

                response.changes.forEach((fileChange) => {
                    let changes = fileChange.changes.map((c) => {
                        let change: editor.IIdentifiedSingleEditOperation = {
                            range: {
                                startLineNumber: c.startLine + 1,
                                startColumn: c.startColumn + 1,
                                endLineNumber: c.endLine + 1,
                                endColumn: c.endColumn + 1,
                            },
                            text: c.newText,
                        };

                        return change;
                    });

                    currentEditor.editor.executeEdits(null, changes);
                });
            } catch (error) {
                return undefined;
            }
        }
    }
}
