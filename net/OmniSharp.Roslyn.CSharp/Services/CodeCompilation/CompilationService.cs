using Microsoft.CodeAnalysis;
using Microsoft.Extensions.Logging;
using OmniSharp.Helpers;
using OmniSharp.Mef;
using OmniSharp.Models.v1.CodeCompilation;
using OmniSharp.Options;
using System;
using System.Collections.Generic;
using System.Composition;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace OmniSharp.Roslyn.CSharp.Services.CodeCompilation
{
    [OmniSharpHandler(OmniSharpEndpoints.Metadata, LanguageNames.CSharp)]
    public class CompilationService : IRequestHandler<CompilationRequest, CompilationResponse>
    {
        private readonly OmniSharpOptions _omniSharpOptions;
        private readonly OmniSharpWorkspace _workspace;
        private readonly ILogger<CompilationService> _logger;

        [ImportingConstructor]
        public CompilationService(OmniSharpWorkspace workspace, 
            OmniSharpOptions omniSharpOptions, 
            ILoggerFactory loggerFactory)
        {
            _workspace = workspace;
            _omniSharpOptions = omniSharpOptions;
            _logger = loggerFactory.CreateLogger<CompilationService>();
        }

        public async Task<CompilationResponse> Handle(CompilationRequest request)
        {
            var project = _workspace
                .CurrentSolution
                .Projects
                .Where(p => p.Name.Equals(request.ProjectName, StringComparison.OrdinalIgnoreCase))
                .FirstOrDefault();

            if (project == null)
            {
                _logger.LogError($"Project {request.ProjectName} was not found!");
                throw new InvalidOperationException($"Project {request.ProjectName} was not found!");
            }

            var compilation = await project.GetCompilationAsync();

            using (var assemblyStream = new MemoryStream())
            using (var pdbStream = new MemoryStream())
            using (var docStream = new MemoryStream())
            {
                var emitResult = compilation.Emit(
                    assemblyStream, 
                    pdbStream, 
                    docStream, 
                    options: new Microsoft.CodeAnalysis.Emit.EmitOptions(
                        debugInformationFormat: Microsoft.CodeAnalysis.Emit.DebugInformationFormat.PortablePdb
                    )
                );

                var diagnostics = emitResult.Diagnostics.Select(d =>
                {
                    var location = d.ToDiagnosticLocation();
                    location.Projects = new List<string> { project.Name };
                    return location;
                });

                var response = new CompilationResponse
                {
                    Diagnostics = diagnostics,
                    Success = emitResult.Success,
                    AssemblyData = assemblyStream.ToArray(),
                    PdbData = pdbStream.ToArray(),
                    DocumentationData = docStream.ToArray()
                };

                return response;
            }
        }
    }
}
