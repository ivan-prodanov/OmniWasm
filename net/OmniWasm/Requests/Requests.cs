using OmniSharp.Models;
using OmniSharp.Models.CodeCheck;
using OmniSharp.Models.Diagnostics;
using OmniSharp.Models.FindImplementations;
using OmniSharp.Models.FindUsages;
using OmniSharp.Models.Format;
using OmniSharp.Models.GotoDefinition;
using OmniSharp.Models.Metadata;
using OmniSharp.Models.Rename;
using OmniSharp.Models.SemanticHighlight;
using OmniSharp.Models.SignatureHelp;
using OmniSharp.Models.TypeLookup;
using OmniSharp.Models.UpdateBuffer;
using OmniSharp.Models.v1.CodeCompilation;
using OmniSharp.Models.v1.Completion;
using OmniSharp.Models.V2;
using OmniSharp.Models.V2.CodeActions;
using OmniSharp.Models.V2.CodeStructure;
using System.Collections.Generic;
using System.Linq;

namespace OmniWasm.Requests
{
    public class AssemblyDto
    {
        public string Name { get; set; }
        public string Path { get; set; }
        public string? DocumentationName { get; set; }
    }

    public class ChangeBufferRequestDto
    {
        public IEnumerable<LinePositionSpanTextChangeDto> Changes { get; set; }
        public bool ApplyChangesTogether { get; set; }
        public string FileName { get; set; }
        public UpdateBufferRequest ToUnderlyingObject()
        {
            return new UpdateBufferRequest
            {
                ApplyChangesTogether = ApplyChangesTogether,
                FileName = FileName,
                Changes = Changes.Select(c => c.ToUnderlyingObject()).ToList(),
            };
        }
    }

    public class LinePositionSpanTextChangeDto
    {
        public string NewText { get; set; }

        public int StartLine { get; set; }
        public int StartColumn { get; set; }
        public int EndLine { get; set; }
        public int EndColumn { get; set; }

        public LinePositionSpanTextChange ToUnderlyingObject()
        {
            return new LinePositionSpanTextChange
            {
                NewText = NewText,
                StartLine = StartLine,
                StartColumn = StartColumn,
                EndLine = EndLine,
                EndColumn = EndColumn,
            };
        }

        public static LinePositionSpanTextChangeDto FromUnderlyingObject(LinePositionSpanTextChange line)
        {
            return new LinePositionSpanTextChangeDto
            {
                NewText = line.NewText,
                StartLine = line.StartLine,
                EndColumn = line.EndColumn,
                EndLine = line.EndLine,
                StartColumn = line.StartColumn
            };
        }

        public static LinePositionSpanTextChange ToUnderlyingObject(LinePositionSpanTextChangeDto line)
        {
            return new LinePositionSpanTextChange
            {
                NewText = line.NewText,
                StartLine = line.StartLine,
                EndColumn = line.EndColumn,
                EndLine = line.EndLine,
                StartColumn = line.StartColumn
            };
        }
    }

    // Code Check
    public class CodeCheckRequestDto
    {
        public string? FileName { get; set; }

        public CodeCheckRequest ToUnderlyingObject()
            => new CodeCheckRequest { FileName = FileName };
    }

    public class QuickFixDto
    {
        public string FileName { get; set; }
        //[JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Line { get; set; }
        //[JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Column { get; set; }
        //[JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int EndLine { get; set; }
        //[JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int EndColumn { get; set; }
        public string Text { get; set; }
        public ICollection<string> Projects { get; set; } = new List<string>();

        public static QuickFixDto FromUnderlyingObject(QuickFix quickFix)
        {
            return new QuickFixDto
            {
                Column = quickFix.Column,
                FileName = quickFix.FileName,
                EndColumn = quickFix.EndColumn,
                EndLine = quickFix.EndLine,
                Line = quickFix.Line,
                Projects = quickFix.Projects,
                Text = quickFix.Text
            };
        }
    }

    public class DiagnosticLocationDto
    {
        public string FileName { get; set; }
        //[JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Line { get; set; }
        //[JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Column { get; set; }
        //[JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int EndLine { get; set; }
        //[JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int EndColumn { get; set; }
        public string Text { get; set; }
        public ICollection<string> Projects { get; set; } = new List<string>();
        public string LogLevel { get; set; }
        public string Id { get; set; }
        public string[] Tags { get; set; }

        public static DiagnosticLocationDto FromUnderlyingObject(DiagnosticLocation diagnosticLocation)
        {
            return new DiagnosticLocationDto
            {
                Column = diagnosticLocation.Column,
                FileName = diagnosticLocation.FileName,
                EndColumn = diagnosticLocation.EndColumn,
                EndLine = diagnosticLocation.EndLine,
                Line = diagnosticLocation.Line,
                Projects = diagnosticLocation.Projects,
                Text = diagnosticLocation.Text,
                Id = diagnosticLocation.Id,
                LogLevel = diagnosticLocation.LogLevel,
                Tags = diagnosticLocation.Tags
            };
        }
    }

    public class CodeCheckResponseDto
    {
        public IEnumerable<DiagnosticLocationDto> Diagnostics { get; set; }

        public static CodeCheckResponseDto FromUnderlyingObject(CodeCheckResponse quickFix)
        {
            return new CodeCheckResponseDto
            {
                Diagnostics = quickFix.Diagnostics.Select(q => DiagnosticLocationDto.FromUnderlyingObject(q)).ToList()
            };
        }
    }

    public class CompletionRequestDto
    {
        public CompletionTriggerKindDto CompletionTrigger { get; set; }
        public char? TriggerCharacter { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }
        public string FileName { get; set; }

        public CompletionRequest ToUnderlyingObject()
        {
            return new CompletionRequest
            {
                CompletionTrigger = (CompletionTriggerKind)(int)CompletionTrigger,
                TriggerCharacter = TriggerCharacter,
                Line = Line,
                Column = Column,
                FileName = FileName
            };
        }
    }

    public enum CompletionTriggerKindDto
    {
        Invoked = 1,
        TriggerCharacter = 2,
        TriggerForIncompleteCompletions = 3
    }

    public class CompletionItemDto
    {
        public string Label { get; set; } = null!;
        public CompletionItemKindDto Kind { get; set; }
        public string? Detail { get; set; }
        public string? Documentation { get; set; }
        public bool Preselect { get; set; }
        public string? SortText { get; set; }
        public string? FilterText { get; set; }
        public InsertTextFormatDto InsertTextFormat { get; set; }
        public LinePositionSpanTextChangeDto? TextEdit { get; set; }
        public LinePositionSpanTextChangeDto[]? AdditionalTextEdits { get; set; }
        public int Data { get; set; }

        public static CompletionItemDto FromUnderlyingObject(CompletionItem completionItem)
        {
            var dto = new CompletionItemDto
            {
                Label = completionItem.Label,
                Kind = (CompletionItemKindDto)(int)completionItem.Kind,
                Detail = completionItem.Detail,
                Documentation = completionItem.Documentation,
                Preselect = completionItem.Preselect,
                SortText = completionItem.SortText,
                FilterText = completionItem.FilterText,
                InsertTextFormat = (InsertTextFormatDto)(int)completionItem.InsertTextFormat,

                Data = completionItem.Data,
            };

            if (completionItem.TextEdit != null)
            {
                dto.TextEdit = LinePositionSpanTextChangeDto.FromUnderlyingObject(completionItem.TextEdit);
            }
            if (completionItem.AdditionalTextEdits != null)
            {
                dto.AdditionalTextEdits = completionItem.AdditionalTextEdits.Select(a => LinePositionSpanTextChangeDto.FromUnderlyingObject(a)).ToArray();
            }

            return dto;
        }

        public static CompletionItem ToUnderlyingObject(CompletionItemDto completionItem)
        {

            var obj = new CompletionItem
            {
                Label = completionItem.Label,
                Kind = (CompletionItemKind)(int)completionItem.Kind,
                Detail = completionItem.Detail,
                Documentation = completionItem.Documentation,
                Preselect = completionItem.Preselect,
                SortText = completionItem.SortText,
                FilterText = completionItem.FilterText,
                InsertTextFormat = (InsertTextFormat)(int)completionItem.InsertTextFormat,

                Data = completionItem.Data,
            };

            if (completionItem.TextEdit != null)
            {
                obj.TextEdit = LinePositionSpanTextChangeDto.ToUnderlyingObject(completionItem.TextEdit);
            }
            if (completionItem.AdditionalTextEdits != null)
            {
                obj.AdditionalTextEdits = completionItem.AdditionalTextEdits.Select(a => LinePositionSpanTextChangeDto.ToUnderlyingObject(a)).ToArray();
            }

            return obj;
        }
    }

    public enum CompletionItemKindDto
    {
        Text = 1,
        Method = 2,
        Function = 3,
        Constructor = 4,
        Field = 5,
        Variable = 6,
        Class = 7,
        Interface = 8,
        Module = 9,
        Property = 10,
        Unit = 11,
        Value = 12,
        Enum = 13,
        Keyword = 14,
        Snippet = 15,
        Color = 16,
        File = 17,
        Reference = 18,
        Folder = 19,
        EnumMember = 20,
        Constant = 21,
        Struct = 22,
        Event = 23,
        Operator = 24,
        TypeParameter = 25,
    }

    public enum InsertTextFormatDto
    {
        PlainText = 1,
        // TODO: Support snippets
        Snippet = 2,
    }

    public class CompletionResponseDto
    {
        public bool IsIncomplete { get; set; }

        public IReadOnlyList<CompletionItemDto> Items { get; set; } = null!;

        public static CompletionResponseDto FromUnderlyingObject(CompletionResponse response)
        {
            return new CompletionResponseDto
            {
                IsIncomplete = response.IsIncomplete,
                Items = response.Items.Select(i => CompletionItemDto.FromUnderlyingObject(i)).ToList(),
            };
        }
    }

    public class CompletionResolveRequestDto
    {
        public CompletionItemDto Item { get; set; }
        public CompletionResolveRequest ToUnderlyingObject()
        {
            return new CompletionResolveRequest
            {
                Item = CompletionItemDto.ToUnderlyingObject(Item)
            };
        }
    }
    public class CompletionResolveResponseDto
    {
        public CompletionItemDto? Item { get; set; }
        public static CompletionResolveResponseDto FromUnderlyingObject(CompletionResolveResponse response)
        {
            var responseDto = new CompletionResolveResponseDto();
            if (response.Item != null)
            {
                responseDto.Item = CompletionItemDto.FromUnderlyingObject(response.Item);
            }

            return responseDto;
        }
    }

    public class FormatAfterKeystrokeRequestDto
    {
        public string Character { get; set; }
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }
        public FormatAfterKeystrokeRequest ToUnderlyingObject()
        {
            return new FormatAfterKeystrokeRequest
            {
                Character = Character,
                FileName = FileName,
                Line = Line,
                Column = Column,
            };
        }
    }

    public class FormatRangeRequestDto
    {
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }
        public int EndLine { get; set; }
        public int EndColumn { get; set; }
        public FormatRangeRequest ToUnderlyingObject()
        {
            return new FormatRangeRequest
            {
                FileName = FileName,
                Line = Line,
                Column = Column,
                EndLine = EndLine,
                EndColumn = EndColumn
            };
        }
    }

    public class FormatRangeResponseDto
    {
        public IEnumerable<LinePositionSpanTextChangeDto> Changes { get; set; }

        public static FormatRangeResponseDto FromUnderlyingObject(FormatRangeResponse response)
        {
            return new FormatRangeResponseDto
            {
                Changes = response.Changes?.Select(c => LinePositionSpanTextChangeDto.FromUnderlyingObject(c))
            };
        }
    }

    public class SignatureHelpRequestDto
    {
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }

        public SignatureHelpRequest ToUnderlyingObject()
        {
            return new SignatureHelpRequest
            {
                FileName = FileName,
                Line = Line,
                Column = Column
            };
        }
    }

    public class SignatureHelpParameterDto
    {
        public string Name { get; set; }

        public string Label { get; set; }

        public string Documentation { get; set; }

        public static SignatureHelpParameterDto FromUnderlyingObject(SignatureHelpParameter parameter)
        {
            return new SignatureHelpParameterDto
            {
                Name = parameter.Name,
                Label = parameter.Label,
                Documentation = parameter.Documentation
            };
        }
    }

    public class DocumentationItemDto
    {
        public string Name { get; set; }
        public string Documentation { get; set; }

        public static DocumentationItemDto FromUnderlyingObject(DocumentationItem documentation)
        {
            return new DocumentationItemDto
            {
                Name = documentation.Name,
                Documentation = documentation.Documentation
            };
        }
    }

    public class DocumentationCommentDto
    {
        public string SummaryText { get; set; }
        public DocumentationItemDto[] TypeParamElements { get; set; }
        public DocumentationItemDto[] ParamElements { get; set; }
        public string ReturnsText { get; set; }
        public string RemarksText { get; set; }
        public string ExampleText { get; set; }
        public string ValueText { get; set; }
        public DocumentationItemDto[] Exception { get; set; }

        public static DocumentationCommentDto FromUnderlyingObject(DocumentationComment documentation)
        {
            if (documentation == null)
            {
                return null;
            }

            return new DocumentationCommentDto
            {
                SummaryText = documentation.SummaryText,
                TypeParamElements = documentation.TypeParamElements?.Select(tp => DocumentationItemDto.FromUnderlyingObject(tp)).ToArray(),
                ParamElements = documentation.ParamElements?.Select(pe => DocumentationItemDto.FromUnderlyingObject(pe)).ToArray(),
                ReturnsText = documentation.ReturnsText,
                RemarksText = documentation.RemarksText,
                ExampleText = documentation.ExampleText,
                ValueText = documentation.ValueText,
                Exception = documentation.Exception?.Select(e => DocumentationItemDto.FromUnderlyingObject(e)).ToArray()
            };
        }
    }

    public class SignatureHelpItemDto
    {
        public string Name { get; set; }

        public string Label { get; set; }

        public string Documentation { get; set; }

        public IEnumerable<SignatureHelpParameterDto> Parameters { get; set; }

        public DocumentationCommentDto StructuredDocumentation { get; set; }

        public static SignatureHelpItemDto FromUnderlyingObject(SignatureHelpItem signature)
        {
            return new SignatureHelpItemDto
            {
                Name = signature.Name,
                Label = signature.Label,
                Documentation = signature.Documentation,
                Parameters = signature.Parameters?.Select(p => SignatureHelpParameterDto.FromUnderlyingObject(p)),
                StructuredDocumentation = DocumentationCommentDto.FromUnderlyingObject(signature.StructuredDocumentation),
            };
        }
    }

    public class SignatureHelpResponseDto
    {
        public IEnumerable<SignatureHelpItemDto> Signatures { get; set; }

        public int ActiveSignature { get; set; }

        public int ActiveParameter { get; set; }

        public static SignatureHelpResponseDto FromUnderlyingObject(SignatureHelpResponse response)
        {
            return new SignatureHelpResponseDto
            {
                ActiveParameter = response.ActiveParameter,
                ActiveSignature = response.ActiveSignature,
                Signatures = response.Signatures?.Select(s => SignatureHelpItemDto.FromUnderlyingObject(s)).ToList()
            };
        }
    }

    public class CodeStructureRequestDto
    {
        public string FileName { get; set; }

        public CodeStructureRequest ToUnderlyingObject()
        {
            return new CodeStructureRequest
            {
                FileName = FileName,
            };
        }
    }

    public class PointDto
    {
        public int Line { get; set; }
        public int Column { get; set; }

        public static PointDto FromUnderlyingObject(Point response)
        {
            return new PointDto
            {
                Line = response.Line,
                Column = response.Column,
            };
        }

        public Point ToUnderlyingObject()
        {
            return new Point
            {
                Line = Line,
                Column = Column
            };
        }
    }

    public class RangeDto
    {
        public PointDto Start { get; set; }
        public PointDto End { get; set; }

        public static RangeDto FromUnderlyingObject(OmniSharp.Models.V2.Range response)
        {
            return new RangeDto
            {
                Start = PointDto.FromUnderlyingObject(response.Start),
                End = PointDto.FromUnderlyingObject(response.End),
            };
        }

        public OmniSharp.Models.V2.Range ToUnderlyingObject()
        {
            return new OmniSharp.Models.V2.Range
            {
                Start = Start?.ToUnderlyingObject(),
                End = End?.ToUnderlyingObject()
            };
        }
    }

    public class CodeElementDto
    {
        public string Kind { get; set; }
        public string Name { get; set; }
        public string DisplayName { get; set; }
        public IReadOnlyList<CodeElementDto> Children { get; set; }
        public IReadOnlyDictionary<string, RangeDto> Ranges { get; set; }
        public IReadOnlyDictionary<string, object> Properties { get; set; }

        public static CodeElementDto FromUnderlyingObject(CodeElement response)
        {
            return new CodeElementDto
            {
                Kind = response.Kind,
                Name = response.Name,
                DisplayName = response.DisplayName,
                Children = response.Children?.Select(c => CodeElementDto.FromUnderlyingObject(c)).ToList(),
                Ranges = response.Ranges?.Select(
                    kvp =>
                    {
                        var dto = RangeDto.FromUnderlyingObject(kvp.Value);
                        return new KeyValuePair<string, RangeDto>(kvp.Key, dto);
                    }).ToDictionary(s => s.Key, s => s.Value),
                Properties = response.Properties,
            };
        }
    }

    public class CodeStructureResponseDto
    {
        public IReadOnlyList<CodeElementDto> Elements { get; set; }
        public static CodeStructureResponseDto FromUnderlyingObject(CodeStructureResponse response)
        {
            return new CodeStructureResponseDto
            {
                Elements = response.Elements?.Select(e => CodeElementDto.FromUnderlyingObject(e)).ToList(),
            };
        }
    }

    public class SemanticHighlightRequestDto
    {
        public string FileName { get; set; }
        public RangeDto? Range { get; set; }

        public SemanticHighlightRequest ToUnderlyingObject()
        {
            return new SemanticHighlightRequest
            {
                FileName = FileName,
                Range = Range?.ToUnderlyingObject(),
            };
        }
    }

    public enum SemanticHighlightClassificationDto
    {
        Comment,
        ExcludedCode,
        Identifier,
        Keyword,
        ControlKeyword,
        NumericLiteral,
        Operator,
        OperatorOverloaded,
        PreprocessorKeyword,
        StringLiteral,
        WhiteSpace,
        Text,
        StaticSymbol,
        PreprocessorText,
        Punctuation,
        VerbatimStringLiteral,
        StringEscapeCharacter,
        ClassName,
        DelegateName,
        EnumName,
        InterfaceName,
        ModuleName,
        StructName,
        TypeParameterName,
        FieldName,
        EnumMemberName,
        ConstantName,
        LocalName,
        ParameterName,
        MethodName,
        ExtensionMethodName,
        PropertyName,
        EventName,
        NamespaceName,
        LabelName,
        XmlDocCommentAttributeName,
        XmlDocCommentAttributeQuotes,
        XmlDocCommentAttributeValue,
        XmlDocCommentCDataSection,
        XmlDocCommentComment,
        XmlDocCommentDelimiter,
        XmlDocCommentEntityReference,
        XmlDocCommentName,
        XmlDocCommentProcessingInstruction,
        XmlDocCommentText,
        XmlLiteralAttributeName,
        XmlLiteralAttributeQuotes,
        XmlLiteralAttributeValue,
        XmlLiteralCDataSection,
        XmlLiteralComment,
        XmlLiteralDelimiter,
        XmlLiteralEmbeddedExpression,
        XmlLiteralEntityReference,
        XmlLiteralName,
        XmlLiteralProcessingInstruction,
        XmlLiteralText,
        RegexComment,
        RegexCharacterClass,
        RegexAnchor,
        RegexQuantifier,
        RegexGrouping,
        RegexAlternation,
        RegexText,
        RegexSelfEscapedCharacter,
        RegexOtherEscape,
    }

    public enum SemanticHighlightModifierDto
    {
        Static
    }

    public class SemanticHighlightSpanDto
    {
        public int StartLine { get; set; }
        public int StartColumn { get; set; }
        public int EndLine { get; set; }
        public int EndColumn { get; set; }
        public SemanticHighlightClassificationDto Type { get; set; }
        public IEnumerable<SemanticHighlightModifierDto> Modifiers { get; set; }

        public static SemanticHighlightSpanDto FromUnderlyingObject(SemanticHighlightSpan response)
        {
            return new SemanticHighlightSpanDto
            {
                StartLine = response.StartLine,
                StartColumn = response.StartColumn,
                EndLine = response.EndLine,
                EndColumn = response.EndColumn,
                Type = (SemanticHighlightClassificationDto)(int)response.Type,
                Modifiers = response.Modifiers?.Select(m => (SemanticHighlightModifierDto)(int)m),
            };
        }
    }

    public class SemanticHighlightResponseDto
    {
        public SemanticHighlightSpanDto[] Spans { get; set; }

        public static SemanticHighlightResponseDto FromUnderlyingObject(SemanticHighlightResponse response)
        {
            return new SemanticHighlightResponseDto
            {
                Spans = response.Spans?.Select(s => SemanticHighlightSpanDto.FromUnderlyingObject(s)).ToArray()
            };
        }
    }

    public class FindUsagesRequestDto
    {
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }
        public bool OnlyThisFile { get; set; }
        public bool ExcludeDefinition { get; set; }

        public FindUsagesRequest ToUnderlyingObject()
        {
            return new FindUsagesRequest
            {
                FileName = FileName,
                Line = Line,
                Column = Column,
                OnlyThisFile = OnlyThisFile,
                ExcludeDefinition = ExcludeDefinition
            };
        }
    }

    public class FindUsagesResponseDto
    {
        public IEnumerable<QuickFixDto> QuickFixes { get; set; }

        public static FindUsagesResponseDto FromUnderlyingObject(QuickFixResponse response)
        {
            return new FindUsagesResponseDto
            {
                QuickFixes = response.QuickFixes?.Select(q => QuickFixDto.FromUnderlyingObject(q)).ToList()
            };
        }
    }

    public class QuickInfoRequestDto
    {
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }

        public QuickInfoRequest ToUnderlyingObject()
        {
            return new QuickInfoRequest
            {
                FileName = FileName,
                Line = Line,
                Column = Column,
            };
        }
    }

    public class QuickInfoResponseDto
    {
        public string Markdown { get; set; }

        public static QuickInfoResponseDto FromUnderlyingObject(QuickInfoResponse response)
        {
            return new QuickInfoResponseDto
            {
                Markdown = response.Markdown
            };
        }
    }

    public class GetCodeActionsRequestDto
    {
        public RangeDto? Selection { get; set; }
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }

        public GetCodeActionsRequest ToUnderlyingObject()
        {
            return new GetCodeActionsRequest
            {
                Selection = Selection?.ToUnderlyingObject(),
                FileName = FileName,
                Line = Line,
                Column = Column,
            };
        }
    }

    public class OmniSharpCodeActionDto
    {
        public string Identifier { get; set; }
        public string Name { get; set; }

        public static OmniSharpCodeActionDto FromUnderlyingObject(OmniSharpCodeAction response)
        {
            return new OmniSharpCodeActionDto
            {
                Identifier = response.Identifier,
                Name = response.Name,
            };
        }
    }

    public class GetCodeActionsResponseDto
    {
        public IEnumerable<OmniSharpCodeActionDto> CodeActions { get; set; }

        public static GetCodeActionsResponseDto FromUnderlyingObject(OmniSharp.Models.V2.CodeActions.GetCodeActionsResponse response)
        {
            return new GetCodeActionsResponseDto
            {
                CodeActions = response.CodeActions?.Select(c => OmniSharpCodeActionDto.FromUnderlyingObject(c)).ToList(),
            };
        }
    }

    public class RunCodeActionRequestDto
    {
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }
        public RangeDto? Selection { get; set; }

        public string Identifier { get; set; }
        public bool WantsTextChanges { get; set; }
        public bool ApplyTextChanges { get; set; } = true;
        public bool WantsAllCodeActionOperations { get; set; }

        public OmniSharp.Models.V2.CodeActions.RunCodeActionRequest ToUnderlyingObject()
        {
            return new OmniSharp.Models.V2.CodeActions.RunCodeActionRequest
            {
                Selection = Selection?.ToUnderlyingObject(),
                FileName = FileName,
                Line = Line,
                Column = Column,
                Identifier = Identifier,
                WantsTextChanges = WantsTextChanges,
                WantsAllCodeActionOperations = WantsAllCodeActionOperations,
                ApplyTextChanges = ApplyTextChanges,
            };
        }
    }

    public enum FileModificationTypeDto
    {
        Modified,
        Opened,
        Renamed
    }

    public class FileOperationResponseDto
    {
        public string FileName { get; set; }

        public FileModificationTypeDto ModificationType { get; set; }

        public string? Buffer { get; set; }
        public IEnumerable<LinePositionSpanTextChangeDto>/*?*/ Changes { get; set; } // <-- TODO bug!
        public string? NewFileName { get; set; }

        public static FileOperationResponseDto FromUnderlyingObject(FileOperationResponse response)
        {
            var dto = new FileOperationResponseDto
            {
                FileName = response.FileName,
                ModificationType = (FileModificationTypeDto)(int)response.ModificationType,
                NewFileName = (response as RenamedFileResponse)?.NewFileName,
                Buffer = (response as ModifiedFileResponse)?.Buffer,
            };

            if (response is ModifiedFileResponse modifiedFileResponse)
            {
                dto.Changes = modifiedFileResponse.Changes?.Select(c => LinePositionSpanTextChangeDto.FromUnderlyingObject(c)).ToList();
            }

            return dto;
        }
    }

    public class RunCodeActionResponseDto
    {
        public IEnumerable<FileOperationResponseDto> Changes { get; set; }

        public static RunCodeActionResponseDto FromUnderlyingObject(OmniSharp.Models.V2.CodeActions.RunCodeActionResponse response)
        {
            return new RunCodeActionResponseDto
            {
                Changes = response.Changes?.Select(c => FileOperationResponseDto.FromUnderlyingObject(c)).ToList(),
            };
        }
    }

    public class RenameRequestDto
    {
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }

        /// <summary>
        ///  When true, return just the text changes.
        /// </summary>
        public bool WantsTextChanges { get; set; }

        /// <summary>
        ///  When true, apply changes immediately on the server.
        /// </summary>
        public bool ApplyTextChanges { get; set; } = true;

        public string RenameTo { get; set; }

        public RenameRequest ToUnderlyingObject()
        {
            return new RenameRequest
            {
                FileName = FileName,
                Line = Line,
                Column = Column,
                WantsTextChanges = WantsTextChanges,
                ApplyTextChanges = ApplyTextChanges,
                RenameTo = RenameTo,
            };
        }
    }

    public class RenameResponseDto
    {
        public IEnumerable<FileOperationResponseDto> Changes { get; set; }

        public static RenameResponseDto FromUnderlyingObject(RenameResponse response)
        {
            return new RenameResponseDto
            {
                Changes = response.Changes?.Select(c => FileOperationResponseDto.FromUnderlyingObject(c)).ToList(),
            };
        }
    }

    public class FindImplementationsRequestDto
    {
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }

        public FindImplementationsRequest ToUnderlyingObject()
        {
            return new FindImplementationsRequest
            {
                FileName = FileName,
                Line = Line,
                Column = Column
            };
        }
    }

    public class FindImplementationsResponseDto
    {
        public IEnumerable<QuickFixDto> QuickFixes { get; set; }

        public static FindImplementationsResponseDto FromUnderlyingObject(QuickFixResponse response)
        {
            return new FindImplementationsResponseDto
            {
                QuickFixes = response.QuickFixes?.Select(q => QuickFixDto.FromUnderlyingObject(q)).ToList()
            };
        }
    }

    public class BlockStructureRequestDto
    {
        public string FileName { get; set; }

        public BlockStructureRequest ToUnderlyingObject()
        {
            return new BlockStructureRequest
            {
                FileName = FileName,
            };
        }
    }

    public class CodeFoldingBlockDto
    {
        /// <summary>
        /// The span of text to collapse.
        /// </summary>
        public RangeDto Range { get; set; }

        /// <summary>
        /// If the block is one of the types specified in <see cref="CodeFoldingBlockKinds"/>, that type.
        /// Otherwise, null.
        /// </summary>
        public string Kind { get; set; }

        public static CodeFoldingBlockDto FromUnderlyingObject(CodeFoldingBlock response)
        {
            return new CodeFoldingBlockDto
            {
                Kind = response.Kind,
                Range = RangeDto.FromUnderlyingObject(response.Range),
            };
        }

        public CodeFoldingBlock ToUnderlyingObject(CodeFoldingBlockDto block)
        {
            return new CodeFoldingBlock(block.Range.ToUnderlyingObject(), block.Kind);
        }
    }

    public class BlockStructureResponseDto
    {
        public IEnumerable<CodeFoldingBlockDto> Spans { get; set; }

        public static BlockStructureResponseDto FromUnderlyingObject(BlockStructureResponse response)
        {
            return new BlockStructureResponseDto
            {
                Spans = response.Spans?.Select(s => CodeFoldingBlockDto.FromUnderlyingObject(s)).ToList(),
            };
        }
    }


    public class GotoDefinitionRequestDto
    {
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }
        public int Timeout { get; set; } = 10000;
        public bool WantMetadata { get; set; }

        public GotoDefinitionRequest ToUnderlyingObject()
        {
            return new GotoDefinitionRequest
            {
                FileName = FileName,
                Line = Line,
                Column = Column,
                Timeout = Timeout,
                WantMetadata = WantMetadata,
            };
        }
    }
    public class MetadataSourceDto
    {
        public string AssemblyName { get; set; }
        public string TypeName { get; set; }
        public string ProjectName { get; set; }
        public string VersionNumber { get; set; }
        public string Language { get; set; }

        public static MetadataSourceDto FromUnderlyingObject(MetadataSource metadata)
        {
            return new MetadataSourceDto
            {
                AssemblyName = metadata.AssemblyName,
                TypeName = metadata.TypeName,
                Language = metadata.Language,
                ProjectName = metadata.ProjectName,
                VersionNumber = metadata.VersionNumber,
            };
        }
    }

    public class GotoDefinitionResponseDto
    {
        public string FileName { get; set; }
        public int Line { get; set; }
        public int Column { get; set; }
        public MetadataSourceDto MetadataSource { get; set; }
        public bool IsEmpty => string.IsNullOrWhiteSpace(FileName) && MetadataSource == null;

        public static GotoDefinitionResponseDto FromUnderlyingObject(GotoDefinitionResponse response)
        {
            var dto = new GotoDefinitionResponseDto
            {
                FileName = response.FileName,
                Line = response.Line,
                Column = response.Column
            };

            if (response.MetadataSource != null)
            {
                dto.MetadataSource = MetadataSourceDto.FromUnderlyingObject(response.MetadataSource);
            }

            return dto;
        }
    }

    public class MetadataRequestDto
    {
        public string AssemblyName { get; set; }
        public string TypeName { get; set; }
        public string ProjectName { get; set; }
        public string VersionNumber { get; set; }
        public string Language { get; set; }
        public int Timeout { get; set; } = 2000;

        public MetadataRequest ToUnderlyingObject()
        {
            return new MetadataRequest
            {
                 AssemblyName = AssemblyName,
                 TypeName = TypeName,
                 ProjectName = ProjectName,
                 VersionNumber = VersionNumber,
                 Language = Language,
                 Timeout = Timeout,
            };
        }
    }

    public class MetadataResponseDto
    {
        public string SourceName { get; set; }
        public string Source { get; set; }

        public static MetadataResponseDto FromUnderlyingObject(MetadataResponse response)
        {
            var dto = new MetadataResponseDto
            {
                SourceName = response.SourceName,
                Source = response.Source,
            };

            return dto;
        }
    }


    public class CompilationRequestDto
    {
        public string ProjectName { get; set; }

        public CompilationRequest ToUnderlyingObject()
        {
            return new CompilationRequest
            {
                ProjectName = ProjectName,
            };
        }
    }

    public class CompilationResponseDto
    {
        public byte[] AssemblyData { get; set; }
        public byte[] PdbData { get; set; }
        public byte[] DocumentationData { get; set; }
        public bool Success { get; set; }
        public IEnumerable<DiagnosticLocationDto> Diagnostics { get; set; }

        public static CompilationResponseDto FromUnderlyingObject(CompilationResponse response)
        {
            var dto = new CompilationResponseDto
            {
                AssemblyData = response.AssemblyData,
                PdbData = response.PdbData,
                DocumentationData = response.DocumentationData,
                Success = response.Success,
                Diagnostics = response.Diagnostics?.Select(d => DiagnosticLocationDto.FromUnderlyingObject(d)).ToList(),
            };

            return dto;
        }
    }
}
