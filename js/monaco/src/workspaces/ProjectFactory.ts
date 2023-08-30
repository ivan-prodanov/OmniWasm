import { CompilerWorkspace } from 'omniwasm';
import { IEditorController } from '../editors';
import { IEditorUriConverter } from '../editors/EditorUriConverter';
import Project from './Project';

export interface IProjectFactory {
    create(name: string, id: string): Project;
}

export class ProjectFactory implements IProjectFactory {
    constructor(
        private readonly editorController: IEditorController,
        private readonly server: CompilerWorkspace,
        private readonly uriConverter: IEditorUriConverter
    ) {}

    create(name: string, id: string): Project {
        return new Project(this.editorController, this.server, id, name, this.uriConverter);
    }
}
