using Microsoft.Extensions.Logging;
using OmniSharp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OmniWasm.Boot
{
    public class WasmEnvironment : IOmniSharpEnvironment
    {
        public LogLevel LogLevel => LogLevel.Information;

        public int HostProcessId => throw new NotSupportedException("Not available in WASM");

        public string TargetDirectory => throw new NotSupportedException("Not available in WASM");

        public string SolutionFilePath => throw new NotSupportedException("Not available in WASM");

        public string SharedDirectory => throw new NotSupportedException("Not available in WASM");

        public string[] AdditionalArguments => throw new NotSupportedException("Not available in WASM");
    }
}
