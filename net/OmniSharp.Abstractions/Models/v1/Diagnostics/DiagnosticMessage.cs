using System;
using System.Collections.Generic;
using System.Linq;

namespace OmniSharp.Models.Diagnostics
{
    public class DiagnosticMessage
    {
        public IEnumerable<DiagnosticResult> Results { get; set; }

        public override string ToString()
        {
            var results = Results.Select(r => r.ToString());
            return string.Join(Environment.NewLine, results);
        }
    }
}