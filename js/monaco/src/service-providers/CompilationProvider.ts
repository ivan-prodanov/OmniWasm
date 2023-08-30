import * as Monaco from 'monaco-editor';
import { CompilationRequestDto, CompilationResponseDto, CompilerWorkspace, DiagnosticLocationDto } from 'omniwasm';
import DisposableWasmConsumer from '../core/DisposableWasmConsumer';

export interface ICompilationBeginningEvent {
    projectName: string;
}

export interface ICompilationDoneEvent {
    projectName: string;
    succeeded: boolean;
}

export interface CompilationResult extends CompilationResponseDto {
    assemblyData: number[];
    pdbData: number[];
    documentationData: number[];
    success: boolean;
    diagnostics: DiagnosticLocationDto[];
}

export interface ICompilationProvider {
    compileProject(projectName: string): Promise<CompilationResult | null>;
    onWillCompileProject: Monaco.IEvent<ICompilationBeginningEvent>;
    onDidCompileProject: Monaco.IEvent<ICompilationDoneEvent>;
}

export class CompilationProvider extends DisposableWasmConsumer implements ICompilationProvider {
    protected readonly _onWillCompileProject: Monaco.Emitter<ICompilationBeginningEvent> = this._register(
        new Monaco.Emitter<ICompilationBeginningEvent>()
    );
    public readonly onWillCompileProject: Monaco.IEvent<ICompilationBeginningEvent> = this._onWillCompileProject.event;

    protected readonly _onDidCompileProject: Monaco.Emitter<ICompilationDoneEvent> = this._register(
        new Monaco.Emitter<ICompilationDoneEvent>()
    );

    public readonly onDidCompileProject: Monaco.IEvent<ICompilationDoneEvent> = this._onDidCompileProject.event;

    constructor(server: CompilerWorkspace) {
        super({ server });
    }

    public async compileProject(projectName: string): Promise<CompilationResult | null> {
        const request: CompilationRequestDto = {
            projectName: projectName,
        };

        let compilationSuccess = false;
        try {
            this._onWillCompileProject.fire({ projectName: projectName });
            const response = await this._server.onCompilationRequest(request);
            compilationSuccess = response.success;

            return response;
        } catch (error) {
            console.error(error);
            return null;
        } finally {
            this._onDidCompileProject.fire({ projectName: projectName, succeeded: compilationSuccess });
        }
    }
}
