import 'monaco-editor';

declare module 'monaco-editor' {
    export class StandaloneCodeEditorServiceImpl {
        openCodeEditor(
            input: any,
            source: editor.ICodeEditor | null,
            sideBySide?: boolean
        ): Promise<editor.ICodeEditor | null>;
    }
    export namespace editor {
        function onDidChangeMarkers(listener: (e: readonly Uri[]) => void): IDisposable;
    }
}
