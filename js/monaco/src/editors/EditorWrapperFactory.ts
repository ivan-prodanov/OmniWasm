import * as Monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import { IFileProvider } from '../workspaces';
import { ChangeStateRepository } from '../workspaces/ChangeStateRepository';
import { EditorWrapper, IEditorWrapper } from './EditorWrapper';

export interface IEditorWrapperFactory {
    create(editor: editor.IStandaloneCodeEditor): IEditorWrapper;
}

export class EditorWrapperFactory implements IEditorWrapperFactory {
    constructor(
        private readonly monaco: typeof Monaco,
        private readonly fileProvider: IFileProvider,
        private readonly globalChangeStateRepository: ChangeStateRepository
    ) {}

    create(editor: editor.IStandaloneCodeEditor): IEditorWrapper {
        return new EditorWrapper(editor, this.monaco, this.fileProvider, this.globalChangeStateRepository);
    }
}
