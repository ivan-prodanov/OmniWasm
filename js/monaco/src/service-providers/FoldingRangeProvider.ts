import { CancellationToken, editor, languages } from 'monaco-editor';
import { BlockStructureRequestDto, CompilerWorkspace } from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';

export default class FoldingRangeProvider extends DisposableWasmConsumer implements languages.FoldingRangeProvider {
    constructor(server: CompilerWorkspace, private readonly uriConverter: IEditorUriConverter) {
        super({ server });
    }

    async provideFoldingRanges(
        model: editor.ITextModel,
        context: languages.FoldingContext,
        token: CancellationToken
    ): Promise<languages.FoldingRange[]> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();
            try {
                let request: BlockStructureRequestDto = {
                    fileName: fileName,
                };

                let response = await this._server.onBlockStructureRequest(request);
                if (token.isCancellationRequested) {
                    return [];
                }

                let ranges: languages.FoldingRange[] = [];
                for (let member of response.spans) {
                    let range: languages.FoldingRange = {
                        start: member.range.start.line + 1,
                        end: member.range.end.line + 1,
                        kind: this.GetType(member.kind),
                    };

                    ranges.push(range);
                }

                return ranges;
            } catch (error) {
                return [];
            }
        }
        return [];
    }

    GetType(type: string): languages.FoldingRangeKind | undefined {
        switch (type) {
            case 'Comment':
                return languages.FoldingRangeKind.Comment;
            case 'Imports':
                return languages.FoldingRangeKind.Imports;
            case 'Region':
                return languages.FoldingRangeKind.Region;
            default:
                return undefined;
        }
    }
}
