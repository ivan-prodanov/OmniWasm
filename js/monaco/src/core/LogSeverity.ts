import { MarkerSeverity } from 'monaco-editor';

export function getSeverity(logLevel: string): MarkerSeverity {
    switch (logLevel) {
        case 'Error':
            return MarkerSeverity.Error;
        case 'Warning':
            return MarkerSeverity.Warning;
        case 'Info':
            return MarkerSeverity.Info;
        case 'Hidden':
            return MarkerSeverity.Hint;
        default:
            throw new Error(`Unknown LogLevel type: ${logLevel}`);
    }
}
