import { CancellationToken, editor, IMarkdownString, languages, Position } from 'monaco-editor';
import { CompilerWorkspace, QuickInfoRequestDto } from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';

export default class HoverProvider extends DisposableWasmConsumer implements languages.HoverProvider {
    constructor(server: CompilerWorkspace, private readonly uriConverter: IEditorUriConverter) {
        super({ server });
    }

    async provideHover(
        model: editor.ITextModel,
        position: Position,
        token: CancellationToken
    ): Promise<languages.Hover | undefined> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            let request: QuickInfoRequestDto = {
                line: position.lineNumber - 1,
                column: position.column - 1,
                fileName: fileName,
            };
            try {
                const response = await this._server.onQuickInfoRequest(request);
                if (token.isCancellationRequested) {
                    return;
                }

                if (!response || !response.markdown) {
                    return undefined;
                }

                let markdown: IMarkdownString = {
                    value: response.markdown,
                    isTrusted: true,
                };

                let hover: languages.Hover = {
                    contents: [markdown],
                };

                return hover;
            } catch (error) {
                return undefined;
            }
        }
    }
}
