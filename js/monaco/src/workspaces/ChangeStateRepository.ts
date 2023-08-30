import * as Monaco from 'monaco-editor';

export class ChangeStateRepository {
    private readonly modelViewStateMap: Map<string, Monaco.editor.ICodeEditorViewState | null> = new Map<
        string,
        Monaco.editor.ICodeEditorViewState
    >();

    getChangeState(modelUri: string): Monaco.editor.ICodeEditorViewState | null {
        return this.modelViewStateMap[modelUri];
    }

    setChangeState(modelUri: string, changeState: Monaco.editor.ICodeEditorViewState | null) {
        this.modelViewStateMap[modelUri] = changeState;
    }

    removeChangeState(modelUri: string) {
        this.modelViewStateMap.delete(modelUri);
    }
}
