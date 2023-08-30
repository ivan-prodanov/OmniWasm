using Microsoft.CodeAnalysis;
using Microsoft.Extensions.Logging;
using OmniWasm.Requests;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace OmniWasm
{
    public class ProjectSystem
    {
        private readonly MetadataReferenceProvider _metadataReferenceProvider;
        private readonly OmniWasmApi _api;
        private readonly ILogger<ProjectSystem> _logger;

        public ProjectSystem(string baseUri, ILoggerFactory loggerFactory, OmniWasmApi api)
        {
            _metadataReferenceProvider = new MetadataReferenceProvider(loggerFactory, baseUri);
            _api = api;
            _logger = loggerFactory.CreateLogger<ProjectSystem>();
        }

        public async Task<string> CreateProject(string projectName, AssemblyDto[] assemblyNames)
        {
            var metadataReferenceTasks =
                assemblyNames
                .Select(a => _metadataReferenceProvider.GetMetadataReference(a.Name, a.Path, a.DocumentationName))
                .ToList();

            var references = await Task.WhenAll(metadataReferenceTasks);

            var id = _api.CreateProject(projectName, references);
            _logger.LogDebug($"Project {projectName} created: {id}");
            return id.Id.ToString();
        }

        public void RemoveProject(string projectId)
        {
            var projectIdInstance = ProjectId.CreateFromSerialized(new Guid(projectId));

            _api.RemoveProject(projectIdInstance);
        }

        public string CreateFile(string projectId, ProjectFile projectFile)
        {
            _logger.LogDebug($"File {projectFile.FileName} added to project {projectId} with code:\n{projectFile.Code}");
            var projectIdInstance = ProjectId.CreateFromSerialized(new Guid(projectId));

            var id = _api.CreateFile(projectIdInstance, projectFile);
            return id.Id.ToString();
        }
    }
}
