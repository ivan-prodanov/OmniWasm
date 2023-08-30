import EditorFile from '../workspaces/EditortFile';

export interface IDocumentEvent {
    file: EditorFile;
}

export interface IDocumentUriEvent {
    fileUri: string;
}

export interface IDocumentUriCancellableEvent {
    fileUri: string | null;
    cancel: boolean;
}
