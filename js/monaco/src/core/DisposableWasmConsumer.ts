import { CompilerWorkspace } from 'omniwasm';
import { Disposable } from './Disposable';

export type CtorParams = {
    server: CompilerWorkspace;
};

export default abstract class DisposableWasmConsumer extends Disposable {
    protected _server: CompilerWorkspace;

    constructor({ server }: CtorParams) {
        super();
        this._server = server;
    }
}
