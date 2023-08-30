import EditorFile from './workspaces/EditortFile';
import { IMarkerChangedEvent, IWorkspace } from './workspaces/Workspace';
import { WorkspaceFactory } from './workspaces/WorkspaceFactory';

export { CompositeDisposable } from './core/CompositeDisposable';
export * from './editors';
export { EditorUriConverter } from './editors';
export { MarkerData } from './event-handlers';
export * from './service-providers';
export { DarkTheme, LightTheme } from './theme';
export * from './workspaces';
export { IWorkspace, IMarkerChangedEvent, WorkspaceFactory, EditorFile };
