import * as Monaco from 'monaco-editor';
import { CancellationToken, editor, languages, Position } from 'monaco-editor';
import { CompilerWorkspace, FindImplementationsRequestDto } from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import { toLocation } from '../utils/typeConversion';

export default class ImplementationsProvider
    extends DisposableWasmConsumer
    implements languages.ImplementationProvider
{
    constructor(
        server: CompilerWorkspace,
        private readonly uriConverter: IEditorUriConverter,
        private readonly monaco: typeof Monaco
    ) {
        super({ server });
    }

    async provideImplementation(
        model: editor.ITextModel,
        position: Position,
        token: CancellationToken
    ): Promise<languages.Definition | undefined> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            let request: FindImplementationsRequestDto = {
                fileName: fileName,
                line: position.lineNumber - 1,
                column: position.column - 1,
            };

            try {
                const response = await this._server.onFindImplementationsRequest(request);
                if (token.isCancellationRequested) {
                    return;
                }

                if (!response || !response.quickFixes) {
                    return undefined;
                }

                const implementations = response.quickFixes.map((fix) => toLocation(fix));
                implementations.forEach((l) => (l.uri = this.monaco.Uri.from(l.uri)));

                return implementations;
            } catch (error) {
                return undefined;
            }
        }
    }
}
