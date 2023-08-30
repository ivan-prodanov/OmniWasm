using OmniSharp.Mef;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OmniSharp.Models.v1.CodeCompilation
{
    [OmniSharpEndpoint(OmniSharpEndpoints.Metadata, typeof(CompilationRequest), typeof(CompilationResponse))]
    public class CompilationRequest : IRequest
    {
        public string ProjectName { get; set; }
    }
}
