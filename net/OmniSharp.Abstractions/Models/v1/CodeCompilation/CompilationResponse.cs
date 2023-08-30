using OmniSharp.Models.Diagnostics;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OmniSharp.Models.v1.CodeCompilation
{
    public class CompilationResponse
    {
        public byte[] AssemblyData { get; set; }
        public byte[] PdbData { get; set; }
        public byte[] DocumentationData { get; set; }
        public bool Success { get; set; }
        public IEnumerable<DiagnosticLocation> Diagnostics { get; set; }
    }
}
