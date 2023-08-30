import { IDisposable } from 'monaco-editor';

// For non monaco-editor use
// export interface IDisposable {
//   dispose: () => void;
// }

export function disposeAll(disposables: IDisposable[]) {
    while (disposables.length) {
        const item = disposables.pop();
        if (item) {
            item.dispose();
        }
    }
}

export abstract class Disposable implements IDisposable {
    private _isDisposed = false;

    protected _disposables: IDisposable[] = [];

    public dispose(): any {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        disposeAll(this._disposables);
    }

    protected _register<T extends IDisposable>(value: T): T {
        if (this._isDisposed) {
            value.dispose();
        } else {
            this._disposables.push(value);
        }
        return value;
    }

    protected get isDisposed() {
        return this._isDisposed;
    }
}
