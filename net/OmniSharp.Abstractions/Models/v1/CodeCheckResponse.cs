using OmniSharp.Models.Diagnostics;
using System.Collections.Generic;
using System.Linq;

namespace OmniSharp.Models
{
    public class CodeCheckResponse : IAggregateResponse
    {
        public CodeCheckResponse(IEnumerable<DiagnosticLocation> quickFixes)
        {
            Diagnostics = quickFixes;
        }

        public CodeCheckResponse()
        {
        }

        public IEnumerable<DiagnosticLocation> Diagnostics { get; set; }

        IAggregateResponse IAggregateResponse.Merge(IAggregateResponse response)
        {
            var quickFixResponse = (CodeCheckResponse)response;
            return new CodeCheckResponse(this.Diagnostics.Concat(quickFixResponse.Diagnostics));
        }
    }
}
