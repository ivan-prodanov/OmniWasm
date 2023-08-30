import * as Monaco from 'monaco-editor';
import { CancellationToken, editor, IEvent, IRange, languages, Position } from 'monaco-editor';
import { CodeElementDto, CompilerWorkspace, FindUsagesRequestDto, RangeDto } from 'omniwasm';
import { SymbolKinds, SymbolRangeNames } from '../constants/symbolConstants';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import { toLocation } from '../utils/typeConversion';

export namespace Structure {
    export function walkCodeElements(
        elements: CodeElementDto[],
        action: (element: CodeElementDto, parentElement?: CodeElementDto) => void
    ) {
        function walker(elements: CodeElementDto[], parentElement?: CodeElementDto) {
            for (let element of elements) {
                action(element, parentElement);

                if (element.children) {
                    walker(element.children, element);
                }
            }
        }

        walker(elements);
    }
}

abstract class OmniSharpCodeLens implements languages.CodeLens {
    range: IRange;
    id?: string;
    command?: languages.Command;

    constructor(range: RangeDto, public fileName: string) {
        this.range = {
            startLineNumber: range.start.line + 1,
            startColumn: range.start.column + 1,
            endLineNumber: range.end.line + 1,
            endColumn: range.end.column + 1,
        };
    }
}

class ReferencesCodeLens extends OmniSharpCodeLens {}

export default class CodeLensProvider extends DisposableWasmConsumer implements languages.CodeLensProvider {
    onDidChange?: IEvent<this> | undefined;

    constructor(
        server: CompilerWorkspace,
        private readonly uriConverter: IEditorUriConverter,
        private readonly monaco: typeof Monaco
    ) {
        super({ server });
    }

    async provideCodeLenses(
        model: editor.ITextModel,
        token: CancellationToken
    ): Promise<languages.CodeLensList | undefined> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            try {
                const response = await this._server.onCodeStructureRequest({
                    fileName: fileName,
                });

                if (token.isCancellationRequested) {
                    return;
                }

                if (response && response.elements) {
                    let codeLenses = createCodeLenses(response.elements, fileName);
                    return {
                        lenses: codeLenses,
                        dispose: () => {},
                    };
                }
            } catch (error) {}
        }

        return undefined;
    }

    async resolveCodeLens(
        model: editor.ITextModel,
        codeLens: languages.CodeLens,
        token: CancellationToken
    ): Promise<languages.CodeLens | undefined> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            const request: FindUsagesRequestDto = {
                fileName: fileName,
                line: codeLens.range.startLineNumber - 1,
                column: codeLens.range.startColumn - 1,
                onlyThisFile: false,
                excludeDefinition: true,
            };

            try {
                let result = await this._server.onFindUsagesRequest(request);
                if (token.isCancellationRequested) {
                    return;
                }
                if (!result || !result.quickFixes) {
                    return undefined;
                }

                const quickFixes = result.quickFixes;
                const count = quickFixes.length;
                const locations = quickFixes.map(toLocation);
                locations.forEach((l) => (l.uri = this.monaco.Uri.from(l.uri)));

                let position = new Position(codeLens.range.startLineNumber, codeLens.range.startColumn);

                codeLens.command = {
                    id: 'editor.action.showReferences',
                    title: count === 1 ? '1 reference' : `${count} references`,
                    arguments: [this.monaco.Uri.from(model.uri), position, locations],
                };

                return codeLens;
            } catch (error) {
                return undefined;
            }
        }
    }
}

function createCodeLenses(elements: CodeElementDto[], fileName: string): languages.CodeLens[] {
    let results: languages.CodeLens[] = [];

    Structure.walkCodeElements(elements, (element) => {
        let codeLenses = createCodeLensesForElement(element, fileName);

        results.push(...codeLenses);
    });

    return results;
}

const filteredSymbolNames: { [name: string]: boolean } = {
    Equals: true,
    Finalize: true,
    GetHashCode: true,
    ToString: true,
    Dispose: true,
    GetEnumerator: true,
};

function isValidElementForReferencesCodeLens(element: CodeElementDto): boolean {
    if (element.kind === SymbolKinds.Namespace) {
        return false;
    }

    if (element.kind === SymbolKinds.Method && filteredSymbolNames[element.name]) {
        return false;
    }

    return true;
}

function createCodeLensesForElement(element: CodeElementDto, fileName: string): languages.CodeLens[] {
    let results: languages.CodeLens[] = [];

    if (isValidElementForReferencesCodeLens(element)) {
        let range = element.ranges[SymbolRangeNames.Name];
        if (range) {
            results.push(new ReferencesCodeLens(range, fileName));
        }
    }

    return results;
}
