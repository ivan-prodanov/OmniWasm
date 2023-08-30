import { Uri } from 'monaco-editor';
import EditorFile, { EditorDocument } from '../workspaces/EditortFile';
import { LanguageType } from '../workspaces/LanguageType';

export interface IEditorUriConverter {
    fromDocument(projectName: string, fileName: string): Uri;
    fromMetadataDocument(fileSource: string);
    fromFile(projectFile: EditorFile): Uri;
    isSolutionFile(fileUri: Uri): boolean;
    toDocument(uri: Uri): EditorDocument;
    toBackupUri(uri: string);
}

export class EditorUriConverter implements IEditorUriConverter {
    private readonly scheme = 'omniwasm';
    readonly metadataScheme = 'omnisharp-metadata';

    fromDocument(projectName: string, fileName: string) {
        const filePath = `${projectName}/${fileName}`.replace(/\\/g, '/');
        return Uri.parse(`${this.scheme}://${filePath}`);
    }

    fromMetadataDocument(fileSource: string) {
        return Uri.parse(
            `${this.scheme}://${fileSource.replace(/\\/g, '/').replace(/(.*)\/(.*)/g, '$1/[metadata] $2')}`
        );
    }

    fromFile(projectFile: EditorDocument) {
        return this.fromDocument(projectFile.projectName, projectFile.displayName);
    }

    isSolutionFile(fileUri: Uri) {
        return fileUri.scheme === this.scheme;
    }

    toDocument(uri: Uri): EditorDocument {
        const regexp = /:\/\/(.+)\/(.+)/;
        const match = uri.toString().match(regexp);
        if (!match || match.length !== 3) {
            throw new Error('Invalid uri.');
        }

        return {
            projectName: match[1],
            displayName: match[2],
            uri: uri.toString(),
            fileType: LanguageType.CSharpFile,
        };
    }

    toBackupUri(uri: string) {
        return `backup-${uri}`;
    }
}
