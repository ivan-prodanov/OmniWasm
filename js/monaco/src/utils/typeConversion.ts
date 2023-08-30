import { IRange, languages, Uri } from 'monaco-editor';
import { QuickFixDto, RangeDto } from 'omniwasm';

export function toRange(rangeLike: { Line: number; Column: number; EndLine: number; EndColumn: number }): IRange {
    let { Line, Column, EndLine, EndColumn } = rangeLike;
    return toVSCodeRange(Line, Column, EndLine, EndColumn);
}

export function toRange2(rangeLike: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}): IRange {
    let { startLine, startColumn, endLine, endColumn } = rangeLike;
    return toVSCodeRange(startLine, startColumn, endLine, endColumn);
}

export function toRange3(range: RangeDto): IRange {
    return toVSCodeRange(range.start.line, range.start.column, range.end.line, range.end.column);
}

export function toRange4(rangeLike: { line: number; column: number; endLine: number; endColumn: number }): IRange {
    let { line, column, endLine, endColumn } = rangeLike;
    return toVSCodeRange(line, column, endLine, endColumn);
}

export function toVSCodeRange(startLine: number, startColumn: number, endLine: number, endColumn: number): IRange {
    let range: IRange = {
        startLineNumber: startLine + 1,
        startColumn: startColumn + 1,
        endLineNumber: endLine + 1,
        endColumn: endColumn + 1,
    };
    return range;
}

export function toLocation(location: QuickFixDto): languages.Location {
    const fileName = Uri.parse(location.fileName);
    let result: languages.Location = {
        range: {
            startLineNumber: location.line + 1,
            startColumn: location.column + 1,
            endLineNumber: location.endLine + 1,
            endColumn: location.endColumn + 1,
        },
        uri: fileName,
    };

    return result;
}
