import { CancellationToken, editor, IMarkdownString, languages, Position, Range as MonacoRange } from 'monaco-editor';
import {
    CompilerWorkspace,
    CompletionItemDto,
    CompletionRequestDto,
    CompletionResolveRequestDto,
    LinePositionSpanTextChangeDto,
} from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';

export class CompletionProvider extends DisposableWasmConsumer implements languages.CompletionItemProvider {
    triggerCharacters: string[] = ['.', ' '];

    private lastCompletions?: Map<languages.CompletionItem, CompletionItemDto>;

    constructor(server: CompilerWorkspace, private readonly uriConverter: IEditorUriConverter) {
        super({ server });
    }

    public async provideCompletionItems(
        model: editor.ITextModel,
        position: Position,
        context: languages.CompletionContext,
        token: CancellationToken
    ): Promise<languages.CompletionList> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            let request: CompletionRequestDto = {
                line: position.lineNumber - 1,
                column: position.column - 1,
                fileName: fileName,
                completionTrigger: context.triggerKind + 1,
                triggerCharacter: context.triggerCharacter?.charCodeAt(0) || null, // TODO FIX: We don't support nullable types
            };

            try {
                const response = await this._server.onCompletionRequest(request);
                if (token.isCancellationRequested) {
                    return {
                        suggestions: [],
                    };
                }

                const mappedItems = response.items.map(this._convertToVscodeCompletionItem);

                let lastCompletions = new Map();

                for (let i = 0; i < mappedItems.length; i++) {
                    lastCompletions.set(mappedItems[i], response.items[i]);
                }

                this.lastCompletions = lastCompletions;

                return { suggestions: mappedItems, incomplete: response.isIncomplete };
            } catch (error) {
                return {
                    suggestions: [],
                };
            }
        }

        return {
            suggestions: [],
        };
    }

    public async resolveCompletionItem(
        item: languages.CompletionItem,
        token: CancellationToken
    ): Promise<languages.CompletionItem | undefined> {
        const lastCompletions = this.lastCompletions;
        if (!lastCompletions) {
            return item;
        }

        const lspItem = lastCompletions.get(item);
        if (!lspItem) {
            return item;
        }

        const request: CompletionResolveRequestDto = { item: lspItem };
        try {
            const response = await this._server.onCompletionResolveRequest(request);
            if (token.isCancellationRequested) {
                return;
            }

            if (response.item) {
                return this._convertToVscodeCompletionItem(response.item);
            } else {
                return item;
            }
        } catch (error) {
            return item;
        }
    }

    private _convertToVscodeCompletionItem(omnisharpCompletion: CompletionItemDto): languages.CompletionItem {
        const docs: IMarkdownString | undefined = omnisharpCompletion.documentation
            ? {
                  value: omnisharpCompletion.documentation,
                  isTrusted: true,
              }
            : undefined;

        const mapRange = function (edit: LinePositionSpanTextChangeDto): MonacoRange {
            return new MonacoRange(edit.startLine + 1, edit.startColumn + 1, edit.endLine + 1, edit.endColumn + 1);
        };

        const mapTextEdit = function (edit: LinePositionSpanTextChangeDto): editor.ISingleEditOperation {
            return { range: mapRange(edit), text: edit.newText };
        };

        const additionalTextEdits = omnisharpCompletion.additionalTextEdits?.map(mapTextEdit);

        const newText = omnisharpCompletion.textEdit?.newText; // ?? omnisharpCompletion.InsertText;
        const insertText = newText;
        // const insertText = omnisharpCompletion.insertTextFormat === 2 //InsertTextFormatDto.Snippet TODO
        //     ? new SnippetString(newText)
        //     : newText;

        const insertRange = omnisharpCompletion.textEdit ? mapRange(omnisharpCompletion.textEdit) : undefined;

        if (!insertRange) {
            console.error('insertRange is NOT SET!');
        }

        var completionItem: languages.CompletionItem = {
            label: omnisharpCompletion.label,
            kind: omnisharpCompletion.kind - 1,
            // detail: omnisharpCompletion.detail || undefined,
            documentation: docs || omnisharpCompletion.documentation || undefined,
            //commitCharacters: omnisharpCompletion.commitCharacters,
            preselect: omnisharpCompletion.preselect,
            filterText: omnisharpCompletion.filterText || undefined,
            insertText: insertText || '',
            range: insertRange || new MonacoRange(0, 0, 0, 0),
            //tags: omnisharpCompletion.tags,
            sortText: omnisharpCompletion.sortText || undefined,
            additionalTextEdits: additionalTextEdits,
        };

        return completionItem;
    }
}
