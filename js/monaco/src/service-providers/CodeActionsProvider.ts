import { CancellationToken, editor, languages, Range } from 'monaco-editor';
import {
    CompilerWorkspace,
    FileModificationTypeDto,
    GetCodeActionsRequestDto,
    RangeDto,
    RunCodeActionRequestDto,
} from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorController } from '../editors';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import { IEditorWrapper } from '../editors/EditorWrapper';

export default class CodeActionsProvider extends DisposableWasmConsumer implements languages.CodeActionProvider {
    protected _editorController: IEditorController;
    private readonly editorCommandIdMap = new Map<IEditorWrapper, string>();

    constructor(
        server: CompilerWorkspace,
        editorController: IEditorController,
        private readonly uriConverter: IEditorUriConverter
    ) {
        super({ server });
        this._editorController = editorController;

        this._register(
            this._editorController.onDidAddEditor((e) => {
                const commandId = e.editor.editor.addCommand(0, this._runCodeAction.bind(this));
                if (commandId) {
                    this.editorCommandIdMap.set(e.editor, commandId);
                } else {
                    console.error(`Failed to add command for editor ${e.editor}`);
                }
            }, this)
        );

        this._register(
            this._editorController.onDidRemoveEditor((e) => {
                this.editorCommandIdMap.delete(e.editor);
            }, this)
        );
    }

    private getRequest(range: Range, fileName: string): GetCodeActionsRequestDto {
        let selection: RangeDto | null = null;
        let line: number = 0;
        let column: number = 0;

        // VS Code will pass the range of the word at the editor caret, even if there isn't a selection.
        // To ensure that we don't suggest selection-based refactorings when there isn't a selection, we first
        // find the text editor for this document and verify that there is a selection.
        // let editorSelection = this._editor.getSelection();

        // if (editorSelection && editorSelection.isEmpty() === false) {
        //   // The editor has a selection. Use it.
        //   selection = {
        //     start: {
        //       line: editorSelection.startLineNumber - 1,
        //       column: editorSelection.startColumn - 1,
        //     },
        //     end: {
        //       line: editorSelection.endLineNumber - 1,
        //       column: editorSelection.endColumn - 1,
        //     },
        //   };
        // } else {
        //   let caretPosition = this._editor.getPosition();
        //   if (caretPosition) {
        //     // The editor does not have a selection. Use the active position of the selection (i.e. the caret).
        //     line = caretPosition.lineNumber - 1;
        //     column = caretPosition.lineNumber - 1;
        //   } else {
        //     // We couldn't find the editor, so just use the range we were provided.
        //     selection = {
        //       start: {
        //         line: range.startLineNumber - 1,
        //         column: range.startColumn - 1,
        //       },
        //       end: { line: range.endLineNumber - 1, column: range.endColumn - 1 },
        //     };
        //   }
        // }
        selection = {
            start: {
                line: range.startLineNumber - 1,
                column: range.startColumn - 1,
            },
            end: { line: range.endLineNumber - 1, column: range.endColumn - 1 },
        };

        return {
            fileName: fileName,
            selection: selection,
            line: line,
            column: column,
        };
    }

    async provideCodeActions(
        model: editor.ITextModel,
        range: Range,
        context: languages.CodeActionContext,
        token: CancellationToken
    ): Promise<languages.CodeActionList | undefined> {
        const currentEditor = this._editorController.currentEditor;
        if (this.uriConverter.isSolutionFile(model.uri) && currentEditor) {
            const commandId = this.editorCommandIdMap.get(currentEditor);
            if (commandId) {
                try {
                    const fileName = model.uri.toString();
                    let request: GetCodeActionsRequestDto = this.getRequest(range, fileName);

                    let response = await this._server.onGetCodeActionsRequest(request);
                    if (token.isCancellationRequested) {
                        return;
                    }

                    let actions = response.codeActions.map((codeAction) => {
                        let runRequest: RunCodeActionRequestDto = {
                            fileName: fileName,
                            line: request.line,
                            column: request.column,
                            selection: request.selection,
                            identifier: codeAction.identifier,
                            wantsTextChanges: true,
                            wantsAllCodeActionOperations: true,
                            applyTextChanges: false,
                        };

                        let action: languages.CodeAction = {
                            title: codeAction.name,
                            diagnostics: context.markers,
                            command: {
                                id: commandId,
                                title: codeAction.name,
                                arguments: [runRequest, token],
                            },
                            kind: 'quickfix',
                        };

                        return action;
                    });

                    let result: languages.CodeActionList = {
                        actions: actions,
                        dispose: () => {},
                    };

                    return result;
                } catch (error) {
                    return Promise.reject(`Problem invoking 'GetCodeActions' on OmniSharp server: ${error}`);
                }
            } else {
                console.error(`CommandId not found for editor ${currentEditor}`);
            }
        } else {
            console.warn('No editor is currently open');
        }
    }

    private async _runCodeAction(_: any, req: RunCodeActionRequestDto): Promise<boolean | string | {}> {
        const response = await this._server.onRunCodeActionsRequest(req);

        // TODO pass editor in args. Don't get currentEditor here.
        const currentEditor = this._editorController.currentEditor;
        if (currentEditor) {
            if (response) {
                let changes = response.changes
                    .filter((c) => c.modificationType === FileModificationTypeDto.Modified)
                    .map((c) => c.changes)
                    .reduce((a, b) => a.concat(b))
                    .map((c) => {
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
                return true;
            }
        }

        return false;
    }
}
