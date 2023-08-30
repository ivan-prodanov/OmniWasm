import EditorFile from './EditortFile';

export default interface IFileProvider {
    getFile(uri: string): EditorFile | null;
}

export class FileProvider implements IFileProvider {
    private readonly _files: EditorFile[] = [];

    getFile(uri: string): EditorFile | null {
        const file = this._files.find((f) => f.uri === uri);

        return file ?? null;
    }

    addFile(file: EditorFile) {
        const fileIndex = this._files.findIndex((x) => x.uri === file.uri);
        if (fileIndex !== -1) {
            throw new Error('FileProvider: File already exists!');
        }

        this._files.push(file);
    }

    removeFile(uri: string): boolean {
        const fileIndex = this._files.findIndex((x) => x.uri === uri);
        if (fileIndex !== -1) {
            this._files.splice(fileIndex, 1);
        }

        return fileIndex !== -1;
    }
}
