import { CancellationToken, editor, languages, Position } from 'monaco-editor';
import { CompilerWorkspace, FindUsagesRequestDto, QuickFixDto } from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import { toRange4 } from '../utils/typeConversion';

export default class DocumentHighlightProvider
    extends DisposableWasmConsumer
    implements languages.DocumentHighlightProvider
{
    constructor(server: CompilerWorkspace, private readonly uriConverter: IEditorUriConverter) {
        super({ server });
    }

    async provideDocumentHighlights(
        model: editor.ITextModel,
        position: Position,
        token: CancellationToken
    ): Promise<languages.DocumentHighlight[] | undefined> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            let request: FindUsagesRequestDto = {
                fileName: fileName,
                line: position.lineNumber - 1,
                column: position.column - 1,
                excludeDefinition: false,
                onlyThisFile: true,
            };

            try {
                let res = await this._server.onFindUsagesRequest(request);
                if (token.isCancellationRequested) {
                    return;
                }

                if (res && Array.isArray(res.quickFixes)) {
                    return res.quickFixes.map(DocumentHighlightProvider._asDocumentHighlight);
                }
            } catch (error) {
                return [];
            }
        }

        return [];
    }

    private static _asDocumentHighlight(quickFix: QuickFixDto): languages.DocumentHighlight {
        return {
            range: toRange4(quickFix),
            kind: languages.DocumentHighlightKind.Read,
        };
    }
}
