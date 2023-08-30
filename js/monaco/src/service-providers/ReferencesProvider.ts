import * as Monaco from 'monaco-editor';
import { CancellationToken, editor, languages, Position } from 'monaco-editor';
import { CompilerWorkspace, FindUsagesRequestDto } from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import { toLocation } from '../utils/typeConversion';

export default class ReferencesProvider extends DisposableWasmConsumer implements languages.ReferenceProvider {
    constructor(
        server: CompilerWorkspace,
        private readonly uriConverter: IEditorUriConverter,
        private readonly monaco: typeof Monaco
    ) {
        super({ server });
    }

    async provideReferences(
        model: editor.ITextModel,
        position: Position,
        context: languages.ReferenceContext,
        token: CancellationToken
    ): Promise<languages.Location[]> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            // TODO excludeDefinition should be set to !context.includeDeclaration
            // UI (not this project) should expose the includeDeclaration option passed down to Monaco
            const request: FindUsagesRequestDto = {
                fileName: fileName,
                line: position.lineNumber - 1,
                column: position.column - 1,
                onlyThisFile: false,
                excludeDefinition: true,
            };

            try {
                let result = await this._server.onFindUsagesRequest(request);
                if (token.isCancellationRequested) {
                    return [];
                }

                if (result && Array.isArray(result.quickFixes)) {
                    const references = result.quickFixes.map(toLocation);
                    references.forEach((l) => (l.uri = this.monaco.Uri.from(l.uri)));

                    return references;
                }
            } catch (error) {
                return [];
            }
        }

        return [];
    }
}
