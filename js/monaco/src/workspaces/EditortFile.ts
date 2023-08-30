import { FileAttributes } from './FileAttributes';
import { LanguageType } from './LanguageType';

export interface EditorDocument {
    uri: string;
    displayName: string;
    projectName: string;
    fileType: LanguageType;
}

export default interface EditorFile extends EditorDocument {
    uri: string;
    displayName: string;
    projectName: string;
    fileType: LanguageType;
    attributes: FileAttributes;
    tags: string[];
}
