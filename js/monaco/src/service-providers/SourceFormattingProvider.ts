import { CancellationToken, editor, languages, Position, Range as MonacoRange } from 'monaco-editor';
import {
    CompilerWorkspace,
    FormatAfterKeystrokeRequestDto,
    FormatRangeRequestDto,
    LinePositionSpanTextChangeDto,
} from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';

export default class SourceFormattingProvider
    extends DisposableWasmConsumer
    implements languages.OnTypeFormattingEditProvider, languages.DocumentRangeFormattingEditProvider
{
    autoFormatTriggerCharacters: string[] = ['}', '/', '\n', ';'];

    constructor(server: CompilerWorkspace, private readonly uriConverter: IEditorUriConverter) {
        super({ server });
    }

    public async provideDocumentRangeFormattingEdits(
        model: editor.ITextModel,
        range: MonacoRange,
        options: languages.FormattingOptions,
        token: CancellationToken
    ): Promise<languages.TextEdit[]> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            let request: FormatRangeRequestDto = {
                fileName: fileName,
                line: range.startLineNumber - 1,
                column: range.startColumn - 1,
                endLine: range.endLineNumber - 1,
                endColumn: range.endColumn - 1,
            };

            try {
                let res = await this._server.onFormatRangeRequest(request);
                if (token.isCancellationRequested) {
                    return [];
                }

                if (res && Array.isArray(res.changes)) {
                    return res.changes.map(SourceFormattingProvider._asEditOptionation);
                } else {
                    return [];
                }
            } catch (error) {
                return [];
            }
        }

        return [];
    }

    public async provideOnTypeFormattingEdits(
        model: editor.ITextModel,
        position: Position,
        ch: string,
        options: languages.FormattingOptions,
        token: CancellationToken
    ): Promise<languages.TextEdit[]> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            let request: FormatAfterKeystrokeRequestDto = {
                fileName: fileName,
                line: position.lineNumber - 1,
                column: position.column - 1,
                character: ch,
            };

            try {
                let res = await this._server.onFormatAfterKeystrokeRequest(request);
                if (token.isCancellationRequested) {
                    return [];
                }

                if (res && Array.isArray(res.changes)) {
                    return res.changes.map(SourceFormattingProvider._asEditOptionation);
                } else {
                    return [];
                }
            } catch (error) {
                return [];
            }
        }

        return [];
    }

    private static _asEditOptionation(change: LinePositionSpanTextChangeDto): languages.TextEdit {
        let bracketFixMatch = /\n(\s*){\n$/m.exec(change.newText);
        if (bracketFixMatch) {
            change.newText += bracketFixMatch[1] + '    ';
        }
        return {
            range: new MonacoRange(
                change.startLine + 1,
                change.startColumn + 1,
                change.endLine + 1,
                change.endColumn + 1
            ),
            text: change.newText,
        };
    }
}
