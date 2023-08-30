import { CancellationToken, editor, IMarkdownString, languages, Position } from 'monaco-editor';
import { CompilerWorkspace, SignatureHelpParameterDto, SignatureHelpRequestDto } from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';

export default class SignatureProvider extends DisposableWasmConsumer implements languages.SignatureHelpProvider {
    readonly signatureHelpTriggerCharacters?: ReadonlyArray<string> = ['(', ','];
    readonly signatureHelpRetriggerCharacters?: ReadonlyArray<string> = ['(', ','];

    constructor(server: CompilerWorkspace, private readonly uriConverter: IEditorUriConverter) {
        super({ server });
    }

    public async provideSignatureHelp(
        model: editor.ITextModel,
        position: Position,
        token: CancellationToken
    ): Promise<languages.SignatureHelpResult | undefined> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            let req: SignatureHelpRequestDto = {
                column: position.column - 1,
                line: position.lineNumber - 1,
                fileName: fileName,
            };

            try {
                let res = await this._server.onSignatureHelpRequest(req);
                if (token.isCancellationRequested) {
                    return;
                }

                if (!res) {
                    return undefined;
                }

                let signatures: languages.SignatureInformation[] = [];

                for (let signature of res.signatures) {
                    let signatureInfo: languages.SignatureInformation = {
                        label: signature.label,
                        documentation: signature.structuredDocumentation.summaryText,
                        parameters: [],
                    };
                    signatures.push(signatureInfo);

                    for (let parameter of signature.parameters) {
                        let parameterInfo: languages.ParameterInformation = {
                            label: parameter.label,
                            documentation: this.GetParameterDocumentation(parameter),
                        };

                        signatureInfo.parameters.push(parameterInfo);
                    }
                }

                let ret: languages.SignatureHelpResult = {
                    value: {
                        activeParameter: res.activeParameter,
                        activeSignature: res.activeSignature,
                        signatures: signatures,
                    },
                    dispose: () => {},
                };

                return ret;
            } catch (error) {
                return undefined;
            }
        }
    }

    private GetParameterDocumentation(parameter: SignatureHelpParameterDto) {
        let summary = parameter.documentation;
        if (summary.length > 0) {
            let paramText = `**${parameter.name}**: ${summary}`;
            let result: IMarkdownString = {
                value: paramText,
                isTrusted: true,
            };
            return result;
        }

        return '';
    }
}
