import * as Monaco from 'monaco-editor';
import { CompilerWorkspace } from 'omniwasm';
import { Language } from '../constants/bootConstants';
import { Disposable } from '../core/Disposable';
import { IEditorController } from '../editors';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import EditorFile from './EditortFile';
import { FileAttributes } from './FileAttributes';
import { LanguageType } from './LanguageType';

export interface IProjectFileEvent {
    file: EditorFile;
}

export default class Project extends Disposable {
    private readonly _files: EditorFile[] = [];
    private readonly languageTypeMap: Map<string, LanguageType> = new Map([[Language, LanguageType.CSharpFile]]);
    protected readonly _onDidAddFile: Monaco.Emitter<IProjectFileEvent> = this._register(
        new Monaco.Emitter<IProjectFileEvent>()
    );
    public readonly onDidAddFile: Monaco.IEvent<IProjectFileEvent> = this._onDidAddFile.event;
    protected readonly _onDidRemoveFile: Monaco.Emitter<IProjectFileEvent> = this._register(
        new Monaco.Emitter<IProjectFileEvent>()
    );
    public readonly onDidRemoveFile: Monaco.IEvent<IProjectFileEvent> = this._onDidRemoveFile.event;

    constructor(
        private readonly editorController: IEditorController,
        private readonly server: CompilerWorkspace,
        private readonly _id: string,
        private readonly _name: string,
        private readonly uriConverter: IEditorUriConverter
    ) {
        super();
    }

    get name() {
        return this._name;
    }

    get id() {
        return this._id;
    }

    get files(): ReadonlyArray<EditorFile> {
        return this._files;
    }

    private getFileType(language: string) {
        if (this.languageTypeMap.has(language)) {
            return this.languageTypeMap[language];
        }

        throw `Unsupported language: ${language}`;
    }

    addFile(fileName: string, language: string, code: string = '', attributes: FileAttributes, tags: string[] = []) {
        if (fileName.includes('/') || fileName.includes('\\')) {
            throw new Error('Invalid character in file name.');
        }

        const fileIndex = this._files.findIndex((x) => x.displayName == fileName);
        if (fileIndex !== -1) {
            throw `File ${fileName} already exists in project ${this._name}!`;
        }

        const uri = this.uriConverter.fromDocument(this._name, fileName).toString();

        const fileId = this.server.createFile(this.id, {
            code: code,
            fileName: uri,
        });

        const file: EditorFile = {
            uri: uri,
            displayName: fileName,
            fileType: this.getFileType(language),
            projectName: this._name,
            attributes: attributes,
            tags: tags,
        };

        this.editorController.addDocument(file, language, code);

        this._files.push(file);
        this._onDidAddFile.fire({ file: file });

        return file;
    }

    removeFile(displayName: string) {
        let removed = false;

        const fileIndex = this._files.findIndex((x) => x.displayName == displayName);
        if (fileIndex !== -1) {
            const file = this._files[fileIndex];
            this._files.splice(fileIndex, 1);
            this.editorController.removeDocument(file);
            removed = true;
            this._onDidRemoveFile.fire({ file: file });
        }

        return removed;
    }
}
