import { editor, MarkerSeverity, MarkerTag, Uri } from 'monaco-editor';
import { DiagnosticLocationDto } from 'omniwasm';
import { CtorParams as DisposableWasmConsumerCtorParams } from '../core/DisposableWasmConsumer';
import { getSeverity } from '../core/LogSeverity';
import { IEditorController } from '../editors';
import { IEditorWrapper } from '../editors/EditorWrapper';

type CtorParams = {
    onMarkersReady?: (markers: MarkerData[], projectName: string | null, fileName: string | null) => void;
    editor: IEditorWrapper;
    editorController: IEditorController;
} & DisposableWasmConsumerCtorParams;

export class MarkerData implements editor.IMarkerData {
    constructor(dto: DiagnosticLocationDto) {
        this.severity = getSeverity(dto.logLevel);
        this.message = dto.text;
        this.startLineNumber = dto.line + 1;
        this.startColumn = dto.column + 1;
        this.endLineNumber = dto.endLine + 1;
        this.endColumn = dto.endColumn + 1;
        this.id = dto.id;
        this.fileUri = dto.fileName;
    }

    code?:
        | string
        | {
              value: string;
              target: Uri;
          };
    severity: MarkerSeverity;
    message: string;
    source?: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    relatedInformation?: editor.IRelatedInformation[];
    tags?: MarkerTag[];
    id: string;
    fileUri: string;
}
