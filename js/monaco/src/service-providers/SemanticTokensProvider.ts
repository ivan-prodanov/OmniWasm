import { CancellationToken, editor, languages, Range as MonacoRange } from 'monaco-editor';
import { CompilerWorkspace, RangeDto, SemanticHighlightClassificationDto, SemanticHighlightRequestDto } from 'omniwasm';
import { SemanticTokenTypes } from '../constants/semanticTokenConstants';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import { SemanticTokensBuilder } from '../utils/SemanticTokensBuilder';

// The default TokenTypes defined by VS Code https://github.com/microsoft/vscode/blob/master/src/vs/platform/theme/common/tokenClassificationRegistry.ts#L393
enum DefaultTokenType {
    comment,
    string,
    keyword,
    number,
    regexp,
    operator,
    namespace,
    type,
    struct,
    class,
    interface,
    enum,
    typeParameter,
    function,
    member,
    macro,
    variable,
    parameter,
    property,
    enumMember,
    event,
    label,
}

enum CustomTokenType {
    plainKeyword = DefaultTokenType.label + 1,
    controlKeyword = 23,
    operatorOverloaded = 24,
    preprocessorKeyword = 25,
    preprocessorText = 26,
    excludedCode = 27,
    punctuation = 28,
    stringVerbatim = 29,
    stringEscapeCharacter = 30,
    delegate = 31,
    module = 32,
    extensionMethod = 33,
    field = 34,
    local = 35,
    xmlDocCommentAttributeName = 36,
    xmlDocCommentAttributeQuotes = 37,
    xmlDocCommentAttributeValue = 38,
    xmlDocCommentCDataSection = 39,
    xmlDocCommentComment = 40,
    xmlDocCommentDelimiter = 41,
    xmlDocCommentEntityReference = 42,
    xmlDocCommentName = 43,
    xmlDocCommentProcessingInstruction = 44,
    xmlDocCommentText = 45,
}

// The default TokenModifiers defined by VS Code https://github.com/microsoft/vscode/blob/master/src/vs/platform/theme/common/tokenClassificationRegistry.ts#L393
enum DefaultTokenModifier {
    declaration,
    static,
    abstract,
    deprecated,
    modification,
    async,
    readonly,
}

enum SemanticHighlightModifier {
    Static,
}

export default class SemanticTokensProvider
    extends DisposableWasmConsumer
    implements languages.DocumentSemanticTokensProvider, languages.DocumentRangeSemanticTokensProvider
{
    // Maybe use cache?
    // private lastCompletions?: Map<string, languages.SemanticTokens | null>;

    constructor(server: CompilerWorkspace, private readonly uriConverter: IEditorUriConverter) {
        super({ server });
    }

    getLegend(): languages.SemanticTokensLegend {
        let legend: languages.SemanticTokensLegend = {
            tokenTypes: tokenTypes,
            tokenModifiers: tokenModifiers,
        };

        return legend;
    }

    async provideDocumentSemanticTokens(
        model: editor.ITextModel,
        lastResultId: string | null,
        token: CancellationToken
    ): Promise<languages.SemanticTokens | null> {
        return this._provideSemanticTokens(model, null, token);
    }

    async provideDocumentRangeSemanticTokens(
        model: editor.ITextModel,
        range: MonacoRange,
        token: CancellationToken
    ): Promise<languages.SemanticTokens | null> {
        const v2Range: RangeDto = {
            start: {
                line: range.startLineNumber - 1,
                column: range.startColumn - 1,
            },
            end: {
                line: range.endLineNumber - 1,
                column: range.endColumn - 1,
            },
        };
        return this._provideSemanticTokens(model, v2Range, token);
    }

    async _provideSemanticTokens(
        model: editor.ITextModel,
        range: RangeDto | null,
        token: CancellationToken
    ): Promise<languages.SemanticTokens | null> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            // Obviously we're gonna use semantic highlighting.

            // const options = this.optionProvider.GetLatestOptions();
            // if (!options.useSemanticHighlighting) {
            //     return null;
            // }

            const fileName = model.uri.toString();

            let req: SemanticHighlightRequestDto = {
                fileName: fileName,
                range: range,
            };

            const versionBeforeRequest = model.getVersionId();

            const response = await this._server.onSemanticHighlightRequest(req);
            if (token.isCancellationRequested) {
                return null;
            }

            const versionAfterRequest = model.getVersionId();

            if (versionBeforeRequest !== versionAfterRequest) {
                // cannot convert result's offsets to (line;col) values correctly
                // a new request will come in soon...
                //
                // here we cannot return null, because returning null would remove all semantic tokens.
                // we must throw to indicate that the semantic tokens should not be removed.
                // using the string busy here because it is not logged to error telemetry if the error text contains busy.
                throw new Error('busy');
            }

            const builder = new SemanticTokensBuilder();
            for (let span of response.spans) {
                const tokenType = tokenTypeMap[span.type];
                if (tokenType === undefined) {
                    continue;
                }

                let tokenModifiers = span.modifiers.reduce(
                    (modifiers, modifier) => modifiers + tokenModifierMap[modifier],
                    0
                );

                // We could add a separate classification for constants but they are
                // supported as a readonly variable. Until we start getting more complete
                // modifiers from the highlight service we can add the readonly modifier here.
                if (span.type === SemanticHighlightClassificationDto.ConstantName) {
                    tokenModifiers += 2 ** DefaultTokenModifier.readonly;
                }

                // We can use the returned range because we made sure the document version is the same.
                for (let line = span.startLine; line <= span.endLine; line++) {
                    const startCharacter = line === span.startLine ? span.startColumn : 0;
                    const endCharacter = line === span.endLine ? span.endColumn : model.getLineLength(line + 1) + 0;

                    builder.push(line, startCharacter, endCharacter - startCharacter, tokenType, tokenModifiers);
                }
            }
            let result = builder.build();
            return result;
        }

        return null;
    }

    //onDidChange?: IEvent<void> | undefined;

    releaseDocumentSemanticTokens(resultId: string | undefined): void {}
}

const tokenTypes: string[] = [];
tokenTypes[DefaultTokenType.comment] = SemanticTokenTypes.comment;
tokenTypes[DefaultTokenType.string] = SemanticTokenTypes.string;
tokenTypes[DefaultTokenType.keyword] = SemanticTokenTypes.keyword;
tokenTypes[DefaultTokenType.number] = SemanticTokenTypes.number;
tokenTypes[DefaultTokenType.regexp] = SemanticTokenTypes.regexp;
tokenTypes[DefaultTokenType.operator] = SemanticTokenTypes.operator;
tokenTypes[DefaultTokenType.namespace] = SemanticTokenTypes.namespace;
tokenTypes[DefaultTokenType.type] = SemanticTokenTypes.type;
tokenTypes[DefaultTokenType.struct] = SemanticTokenTypes.struct;
tokenTypes[DefaultTokenType.class] = SemanticTokenTypes.class;
tokenTypes[DefaultTokenType.interface] = SemanticTokenTypes.interface;
tokenTypes[DefaultTokenType.enum] = SemanticTokenTypes.enum;
tokenTypes[DefaultTokenType.typeParameter] = SemanticTokenTypes.typeParameter;
tokenTypes[DefaultTokenType.function] = SemanticTokenTypes.function;
tokenTypes[DefaultTokenType.member] = SemanticTokenTypes.member;
tokenTypes[DefaultTokenType.macro] = SemanticTokenTypes.macro;
tokenTypes[DefaultTokenType.variable] = SemanticTokenTypes.variable;
tokenTypes[DefaultTokenType.parameter] = SemanticTokenTypes.parameter;
tokenTypes[DefaultTokenType.property] = SemanticTokenTypes.property;
tokenTypes[DefaultTokenType.enumMember] = 'enumMember';
tokenTypes[DefaultTokenType.event] = 'event';
tokenTypes[DefaultTokenType.label] = SemanticTokenTypes.label;
tokenTypes[CustomTokenType.plainKeyword] = 'plainKeyword';
tokenTypes[CustomTokenType.controlKeyword] = 'controlKeyword';
tokenTypes[CustomTokenType.operatorOverloaded] = 'operatorOverloaded';
tokenTypes[CustomTokenType.preprocessorKeyword] = 'preprocessorKeyword';
tokenTypes[CustomTokenType.preprocessorText] = 'preprocessorText';
tokenTypes[CustomTokenType.excludedCode] = 'excludedCode';
tokenTypes[CustomTokenType.punctuation] = 'punctuation';
tokenTypes[CustomTokenType.stringVerbatim] = 'stringVerbatim';
tokenTypes[CustomTokenType.stringEscapeCharacter] = 'stringEscapeCharacter';
tokenTypes[CustomTokenType.delegate] = 'delegate';
tokenTypes[CustomTokenType.module] = 'module';
tokenTypes[CustomTokenType.extensionMethod] = 'extensionMethod';
tokenTypes[CustomTokenType.field] = 'field';
tokenTypes[CustomTokenType.local] = 'local';
tokenTypes[CustomTokenType.xmlDocCommentAttributeName] = 'xmlDocCommentAttributeName';
tokenTypes[CustomTokenType.xmlDocCommentAttributeQuotes] = 'xmlDocCommentAttributeQuotes';
tokenTypes[CustomTokenType.xmlDocCommentAttributeValue] = 'xmlDocCommentAttributeValue';
tokenTypes[CustomTokenType.xmlDocCommentCDataSection] = 'xmlDocCommentCDataSection';
tokenTypes[CustomTokenType.xmlDocCommentComment] = 'xmlDocCommentComment';
tokenTypes[CustomTokenType.xmlDocCommentDelimiter] = 'xmlDocCommentDelimiter';
tokenTypes[CustomTokenType.xmlDocCommentEntityReference] = 'xmlDocCommentEntityReference';
tokenTypes[CustomTokenType.xmlDocCommentName] = 'xmlDocCommentName';
tokenTypes[CustomTokenType.xmlDocCommentProcessingInstruction] = 'xmlDocCommentProcessingInstruction';
tokenTypes[CustomTokenType.xmlDocCommentText] = 'xmlDocCommentText';

const tokenModifiers: string[] = [];
tokenModifiers[DefaultTokenModifier.declaration] = 'declaration';
tokenModifiers[DefaultTokenModifier.static] = 'static';
tokenModifiers[DefaultTokenModifier.abstract] = 'abstract';
tokenModifiers[DefaultTokenModifier.deprecated] = 'deprecated';
tokenModifiers[DefaultTokenModifier.modification] = 'modification';
tokenModifiers[DefaultTokenModifier.async] = 'async';
tokenModifiers[DefaultTokenModifier.readonly] = 'readonly';

const tokenTypeMap: (number | undefined)[] = [];
tokenTypeMap[SemanticHighlightClassificationDto.Comment] = DefaultTokenType.comment;
tokenTypeMap[SemanticHighlightClassificationDto.ExcludedCode] = CustomTokenType.excludedCode;
tokenTypeMap[SemanticHighlightClassificationDto.Identifier] = DefaultTokenType.variable;
tokenTypeMap[SemanticHighlightClassificationDto.Keyword] = CustomTokenType.plainKeyword;
tokenTypeMap[SemanticHighlightClassificationDto.ControlKeyword] = CustomTokenType.controlKeyword;
tokenTypeMap[SemanticHighlightClassificationDto.NumericLiteral] = DefaultTokenType.number;
tokenTypeMap[SemanticHighlightClassificationDto.Operator] = DefaultTokenType.operator;
tokenTypeMap[SemanticHighlightClassificationDto.OperatorOverloaded] = CustomTokenType.operatorOverloaded;
tokenTypeMap[SemanticHighlightClassificationDto.PreprocessorKeyword] = CustomTokenType.preprocessorKeyword;
tokenTypeMap[SemanticHighlightClassificationDto.StringLiteral] = DefaultTokenType.string;
tokenTypeMap[SemanticHighlightClassificationDto.WhiteSpace] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.Text] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.StaticSymbol] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.PreprocessorText] = CustomTokenType.preprocessorText;
tokenTypeMap[SemanticHighlightClassificationDto.Punctuation] = CustomTokenType.punctuation;
tokenTypeMap[SemanticHighlightClassificationDto.VerbatimStringLiteral] = CustomTokenType.stringVerbatim;
tokenTypeMap[SemanticHighlightClassificationDto.StringEscapeCharacter] = CustomTokenType.stringEscapeCharacter;
tokenTypeMap[SemanticHighlightClassificationDto.ClassName] = DefaultTokenType.class;
tokenTypeMap[SemanticHighlightClassificationDto.DelegateName] = CustomTokenType.delegate;
tokenTypeMap[SemanticHighlightClassificationDto.EnumName] = DefaultTokenType.enum;
tokenTypeMap[SemanticHighlightClassificationDto.InterfaceName] = DefaultTokenType.interface;
tokenTypeMap[SemanticHighlightClassificationDto.ModuleName] = CustomTokenType.module;
tokenTypeMap[SemanticHighlightClassificationDto.StructName] = DefaultTokenType.struct;
tokenTypeMap[SemanticHighlightClassificationDto.TypeParameterName] = DefaultTokenType.typeParameter;
tokenTypeMap[SemanticHighlightClassificationDto.FieldName] = CustomTokenType.field;
tokenTypeMap[SemanticHighlightClassificationDto.EnumMemberName] = DefaultTokenType.enumMember;
tokenTypeMap[SemanticHighlightClassificationDto.ConstantName] = DefaultTokenType.variable;
tokenTypeMap[SemanticHighlightClassificationDto.LocalName] = CustomTokenType.local;
tokenTypeMap[SemanticHighlightClassificationDto.ParameterName] = DefaultTokenType.parameter;
tokenTypeMap[SemanticHighlightClassificationDto.MethodName] = DefaultTokenType.member;
tokenTypeMap[SemanticHighlightClassificationDto.ExtensionMethodName] = CustomTokenType.extensionMethod;
tokenTypeMap[SemanticHighlightClassificationDto.PropertyName] = DefaultTokenType.property;
tokenTypeMap[SemanticHighlightClassificationDto.EventName] = DefaultTokenType.event;
tokenTypeMap[SemanticHighlightClassificationDto.NamespaceName] = DefaultTokenType.namespace;
tokenTypeMap[SemanticHighlightClassificationDto.LabelName] = DefaultTokenType.label;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentAttributeName] =
    CustomTokenType.xmlDocCommentAttributeName;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentAttributeQuotes] =
    CustomTokenType.xmlDocCommentAttributeQuotes;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentAttributeValue] =
    CustomTokenType.xmlDocCommentAttributeValue;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentCDataSection] = CustomTokenType.xmlDocCommentCDataSection;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentComment] = CustomTokenType.xmlDocCommentComment;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentDelimiter] = CustomTokenType.xmlDocCommentDelimiter;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentEntityReference] =
    CustomTokenType.xmlDocCommentEntityReference;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentName] = CustomTokenType.xmlDocCommentName;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentProcessingInstruction] =
    CustomTokenType.xmlDocCommentProcessingInstruction;
tokenTypeMap[SemanticHighlightClassificationDto.XmlDocCommentText] = CustomTokenType.xmlDocCommentText;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralAttributeName] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralAttributeQuotes] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralAttributeValue] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralCDataSection] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralComment] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralDelimiter] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralEmbeddedExpression] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralEntityReference] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralName] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralProcessingInstruction] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.XmlLiteralText] = undefined;
tokenTypeMap[SemanticHighlightClassificationDto.RegexComment] = DefaultTokenType.regexp;
tokenTypeMap[SemanticHighlightClassificationDto.RegexCharacterClass] = DefaultTokenType.regexp;
tokenTypeMap[SemanticHighlightClassificationDto.RegexAnchor] = DefaultTokenType.regexp;
tokenTypeMap[SemanticHighlightClassificationDto.RegexQuantifier] = DefaultTokenType.regexp;
tokenTypeMap[SemanticHighlightClassificationDto.RegexGrouping] = DefaultTokenType.regexp;
tokenTypeMap[SemanticHighlightClassificationDto.RegexAlternation] = DefaultTokenType.regexp;
tokenTypeMap[SemanticHighlightClassificationDto.RegexText] = DefaultTokenType.regexp;
tokenTypeMap[SemanticHighlightClassificationDto.RegexSelfEscapedCharacter] = DefaultTokenType.regexp;
tokenTypeMap[SemanticHighlightClassificationDto.RegexOtherEscape] = DefaultTokenType.regexp;

const tokenModifierMap: number[] = [];
tokenModifierMap[SemanticHighlightModifier.Static] = 2 ** DefaultTokenModifier.static;
