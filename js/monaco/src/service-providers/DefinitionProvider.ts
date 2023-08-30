import * as Monaco from 'monaco-editor';
import { CancellationToken, editor, languages, Position, Uri } from 'monaco-editor';
import {
    CompilerWorkspace,
    GotoDefinitionRequestDto,
    GotoDefinitionResponseDto,
    MetadataRequestDto,
    MetadataSourceDto,
} from 'omniwasm';
import { Language } from '../constants/bootConstants';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';
import { IEditorUriConverter } from '../editors/EditorUriConverter';

export default class DefinitionProvider extends DisposableWasmConsumer implements languages.DefinitionProvider {
    readonly scheme = 'omnisharp-metadata';

    constructor(
        server: CompilerWorkspace,
        private readonly monaco: typeof Monaco,
        private readonly uriConverter: IEditorUriConverter
    ) {
        super({ server: server });
    }

    async provideDefinition(
        model: editor.ITextModel,
        position: Position,
        token: CancellationToken
    ): Promise<languages.Definition | undefined> {
        if (this.uriConverter.isSolutionFile(model.uri)) {
            const fileName = model.uri.toString();

            let request: GotoDefinitionRequestDto = {
                fileName: fileName,
                line: position.lineNumber - 1,
                column: position.column - 1,
                wantMetadata: true, // TODO multi file
                timeout: 10_000,
            };

            let location: languages.Location;

            try {
                let gotoDefinitionResponse = await this._server.onGoToDefinitionRequest(request);
                if (token.isCancellationRequested) {
                    return;
                }

                // the defintion is in source
                if (gotoDefinitionResponse && gotoDefinitionResponse.fileName) {
                    // if it is part of an already used metadata file, retrieve its uri instead of going to the physical file
                    if (gotoDefinitionResponse.fileName.startsWith('$metadata$')) {
                        const uri: Uri = this.createUri(gotoDefinitionResponse.fileName);
                        location = this.toLocationFromUri(uri, gotoDefinitionResponse);
                    } else {
                        // if it is a normal source definition, convert the response to a location
                        location = this.toLocation(gotoDefinitionResponse);
                    }

                    return [location];
                    // the definition is in metadata
                } else if (gotoDefinitionResponse.metadataSource) {
                    const metadataSource: MetadataSourceDto = gotoDefinitionResponse.metadataSource;

                    // go to metadata endpoint for more information
                    let metadataRequest: MetadataRequestDto = {
                        timeout: 5000,
                        assemblyName: metadataSource.assemblyName,
                        versionNumber: metadataSource.versionNumber,
                        projectName: metadataSource.projectName,
                        language: metadataSource.language,
                        typeName: metadataSource.typeName,
                    };
                    const metadataResponse = await this._server.onMetadataRequest(metadataRequest);
                    if (token.isCancellationRequested) {
                        return;
                    }

                    if (!metadataResponse || !metadataResponse.source || !metadataResponse.sourceName) {
                        return;
                    }

                    const uri: Uri = this.createUri(metadataResponse.sourceName);
                    let model = this.monaco.editor.getModel(uri);
                    if (!model) {
                        model = this.monaco.editor.createModel(metadataResponse.source, Language, uri);
                    }

                    location = this.toLocationFromUri(uri, gotoDefinitionResponse);

                    return [location];
                }
            } catch (error) {
                return [];
            }
        }

        return [];
    }

    private createUri(sourceName: string): Uri {
        return Uri.parse(
            this.scheme + '://' + sourceName.replace(/\\/g, '/').replace(/(.*)\/(.*)/g, '$1/[metadata] $2')
        );
    }

    private toLocationFromUri(uri: Uri, location: GotoDefinitionResponseDto): languages.Location {
        return {
            uri: uri,
            range: {
                startLineNumber: location.line + 1 - 3,
                endLineNumber: location.line + 1 - 3,
                startColumn: location.column + 1,
                endColumn: location.column + 1,
            },
        };
    }

    private toLocation(location: GotoDefinitionResponseDto): languages.Location {
        const documentUri = this.monaco.Uri.parse(location.fileName);
        let result: languages.Location = {
            range: {
                startLineNumber: location.line + 1,
                endLineNumber: location.line + 1,
                startColumn: location.column + 1,
                endColumn: location.column + 1,
            },
            uri: documentUri,
        };

        return result;
    }
}
