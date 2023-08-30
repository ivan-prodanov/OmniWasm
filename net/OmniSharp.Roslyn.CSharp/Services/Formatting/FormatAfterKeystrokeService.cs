using System.Composition;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OmniSharp.Extensions;
using OmniSharp.Mef;
using OmniSharp.Models.Format;
using OmniSharp.Options;
using OmniSharp.Roslyn.CSharp.Workers.Formatting;

namespace OmniSharp.Roslyn.CSharp.Services.Formatting
{
    [OmniSharpHandler(OmniSharpEndpoints.FormatAfterKeystroke, LanguageNames.CSharp)]
    public class FormatAfterKeystrokeService : IRequestHandler<FormatAfterKeystrokeRequest, FormatRangeResponse>
    {
        private readonly OmniSharpWorkspace _workspace;
        private readonly OmniSharpOptions _omnisharpOptions;
        private readonly ILoggerFactory _loggerFactory;

        [ImportingConstructor]
        public FormatAfterKeystrokeService(OmniSharpWorkspace workspace, OmniSharpOptions omnisharpOptions, ILoggerFactory loggerFactory)
        {
            _workspace = workspace;
            _omnisharpOptions = omnisharpOptions;
            _loggerFactory = loggerFactory;
        }

        public async Task<FormatRangeResponse> Handle(FormatAfterKeystrokeRequest request)
        {
            var document = _workspace.GetDocument(request.FileName);
            if (document == null)
            {
                return null;
            }

            var text = await document.GetTextAsync();
            int position = text.GetTextPosition(request);

            bool formatOpenBracket = false;
            if (request.Line > 0)
            {
                var previousLine = text.Lines[request.Line - 1];

                var openBracketFound = false;
                var closeParenthesisFound = false;
                for (int i = 1; i < 5; i++)
                {
                    if (previousLine.End - i < 0)
                    {
                        break;
                    }

                    if (text[previousLine.End - i] == '{')
                    {
                        openBracketFound = true;
                    }
                    if (text[previousLine.End - i] == ')')
                    {
                        closeParenthesisFound = true;
                        break;
                    }
                }
                formatOpenBracket = openBracketFound && closeParenthesisFound;
            }
            var changes = await FormattingWorker.GetFormattingChangesAfterKeystroke(document, position, request.Char, formatOpenBracket, _omnisharpOptions, _loggerFactory);

            return new FormatRangeResponse()
            {
                Changes = changes
            };
        }
    }
}
