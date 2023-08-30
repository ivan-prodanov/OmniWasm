import { IEditorController } from '../editors';
import { IEditorWrapper } from '../editors/EditorWrapper';
import { MarkerData } from './ModelContentChanged';

export interface IModelContentChangedFactory {
    create(
        editor: IEditorWrapper,
        editorController: IEditorController,
        onMarkersReady: (markers: MarkerData[], projectName: string | null, fileName: string | null) => void
    ); // ): ModelContentChangedEventHandler;
}

// export class ModelContentChangedFactory implements IModelContentChangedFactory {
//     constructor(private readonly server: CompilerWorkspace) {}

//     create(
//         editor: IEditorWrapper,
//         editorController: IEditorController,
//         onMarkersReady: (markers: MarkerData[], projectName: string | null, fileName: string | null) => void
//     ) {
//         return new ModelContentChangedEventHandler({
//             server: this.server,
//             onMarkersReady: onMarkersReady,
//             editor: editor,
//             editorController: editorController,
//         });
//     }
// }
