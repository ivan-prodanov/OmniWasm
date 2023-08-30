import * as Monaco from 'monaco-editor';
import { CompilerWorkspace } from 'omniwasm';
import { IWorkspace } from '..';
import Workspace from './Workspace';

export class WorkspaceFactory {
    createWorkspace(monaco: typeof Monaco, wasmApi: CompilerWorkspace): IWorkspace {
        return new Workspace(monaco, wasmApi);
    }
}
