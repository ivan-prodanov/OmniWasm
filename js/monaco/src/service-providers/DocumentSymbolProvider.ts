import { CancellationToken, editor, languages } from 'monaco-editor';
import { CodeElementDto, CompilerWorkspace } from 'omniwasm';
import { SymbolKinds, SymbolRangeNames } from '../constants/symbolConstants';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import { toRange3 } from '../utils/typeConversion';

export default class DocumentSymbolProvider extends DisposableWasmConsumer implements languages.DocumentSymbolProvider {
    constructor(server: CompilerWorkspace, private readonly uriConverter: IEditorUriConverter) {
        super({ server });
    }

    async provideDocumentSymbols(
        model: editor.ITextModel,
        token: CancellationToken
    ): Promise<languages.DocumentSymbol[]> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            try {
                const response = await this._server.onCodeStructureRequest({
                    fileName: fileName,
                });
                if (token.isCancellationRequested) {
                    return [];
                }

                if (response && response.elements) {
                    return createSymbols(response.elements);
                }
            } catch (error) {
                return [];
            }
        }

        return [];
    }
}

function createSymbols(elements: CodeElementDto[]): languages.DocumentSymbol[] {
    let results: languages.DocumentSymbol[] = [];

    elements.forEach((element) => {
        let symbol = createSymbolForElement(element);
        if (element.children) {
            symbol.children = createSymbols(element.children);
        }

        results.push(symbol);
    });

    return results;
}

function createSymbolForElement(element: CodeElementDto): languages.DocumentSymbol {
    const fullRange = element.ranges[SymbolRangeNames.Full];
    const nameRange = element.ranges[SymbolRangeNames.Name];

    let symbol: languages.DocumentSymbol = {
        kind: toSymbolKind(element.kind),
        name: element.displayName,
        detail: '',
        range: toRange3(fullRange),
        selectionRange: toRange3(nameRange),
        tags: [],
    };

    return symbol;
}

const kinds: { [kind: string]: languages.SymbolKind } = {};

kinds[SymbolKinds.Class] = languages.SymbolKind.Class;
kinds[SymbolKinds.Delegate] = languages.SymbolKind.Class;
kinds[SymbolKinds.Enum] = languages.SymbolKind.Enum;
kinds[SymbolKinds.Interface] = languages.SymbolKind.Interface;
kinds[SymbolKinds.Struct] = languages.SymbolKind.Struct;

kinds[SymbolKinds.Constant] = languages.SymbolKind.Constant;
kinds[SymbolKinds.Destructor] = languages.SymbolKind.Method;
kinds[SymbolKinds.EnumMember] = languages.SymbolKind.EnumMember;
kinds[SymbolKinds.Event] = languages.SymbolKind.Event;
kinds[SymbolKinds.Field] = languages.SymbolKind.Field;
kinds[SymbolKinds.Indexer] = languages.SymbolKind.Property;
kinds[SymbolKinds.Method] = languages.SymbolKind.Method;
kinds[SymbolKinds.Operator] = languages.SymbolKind.Operator;
kinds[SymbolKinds.Property] = languages.SymbolKind.Property;

kinds[SymbolKinds.Namespace] = languages.SymbolKind.Namespace;
kinds[SymbolKinds.Unknown] = languages.SymbolKind.Class;

function toSymbolKind(kind: string): languages.SymbolKind {
    // Note: 'constructor' is a special property name for JavaScript objects.
    // So, we need to handle it specifically.
    if (kind === 'constructor') {
        return languages.SymbolKind.Constructor;
    }

    return kinds[kind];
}
