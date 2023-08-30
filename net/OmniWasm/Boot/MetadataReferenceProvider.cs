using Microsoft.CodeAnalysis;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

namespace OmniWasm
{
    public class MetadataReferenceProvider
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MetadataReferenceProvider> _logger;
        private Dictionary<string, string> assemblyDocumentationRedirects = new Dictionary<string, string>
        {
            ["System.Private.CoreLib"] = "mscorlib"
        };

        public MetadataReferenceProvider(ILoggerFactory loggerFactory, string baseUri)
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(baseUri)
            };

            _logger = loggerFactory.CreateLogger<MetadataReferenceProvider>();
        }

        private string GetDocumentationFileName(string assemblyFileName)
        {
            var assemblyName = Path.GetFileNameWithoutExtension(assemblyFileName);
            if (assemblyDocumentationRedirects.TryGetValue(assemblyName, out var documentationRedirect))
            {
                var docPath = assemblyFileName.Replace(Path.GetFileName(assemblyFileName), $"{documentationRedirect}.xml");
                return docPath;
            }
            else
            {
                string documentationName = Path.ChangeExtension(assemblyFileName, ".xml");
                return documentationName;
            }
        }

        public async Task<MetadataReference> GetMetadataReference(string assemblyFileName, string assemblyPath, string documentationName = null)
        {
            using var stream = await _httpClient.GetStreamAsync(Path.Combine(assemblyPath, assemblyFileName));
            byte[] documentation = null;
            if (string.IsNullOrEmpty(documentationName) == false)
            {
                // might return an html page here, but the document provider can handle it
                documentation = await _httpClient.GetByteArrayAsync(Path.Combine(assemblyPath, GetDocumentationFileName(documentationName)));
            }

            var metedataReference = MetadataReference.CreateFromStream(stream, documentation: documentation != null ? XmlDocumentationProvider.CreateFromBytes(documentation) : null);
            _logger.LogTrace($"Downloaded {assemblyFileName}{(documentation != null ? (" and corresponding documentation " + documentationName) : string.Empty)}");

            return metedataReference;
        }
    }
}
