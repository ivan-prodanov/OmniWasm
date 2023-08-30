import { IDisposable } from 'monaco-editor';
import { Disposable } from './Disposable';

export class CompositeDisposable extends Disposable {
    constructor(...disposables: IDisposable[]) {
        super();

        for (const disposable of disposables) {
            if (disposable) {
                this._register(disposable);
            } else {
                throw new Error('null disposables are not supported');
            }
        }
    }

    public add(disposable: IDisposable) {
        if (!disposable) {
            throw new Error('disposable cannot be null');
        }

        this._register(disposable);
    }
}
