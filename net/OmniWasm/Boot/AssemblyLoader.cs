using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Reflection;
using Microsoft.Extensions.Logging;
using Microsoft.CodeAnalysis;
using OmniSharp.Services;

namespace OmniWasm
{
    internal class AssemblyLoader : IAssemblyLoader
    {
        private static readonly ConcurrentDictionary<string, Assembly> AssemblyCache = new ConcurrentDictionary<string, Assembly>(StringComparer.OrdinalIgnoreCase);
        private readonly ILogger _logger;

        public AssemblyLoader(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<AssemblyLoader>();
        }

        public Assembly Load(AssemblyName name)
        {
            Assembly result = null;
            try
            {
                result = Assembly.Load(name);
                _logger.LogTrace($"Assembly loaded: {name}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to load assembly: {name}");
            }

            return result;
        }

        public IReadOnlyList<Assembly> LoadAllFrom(string folderPath)
        {
            throw new NotSupportedException("Loading all assemblies from a folder is not supported in WASM");
        }

        public Assembly LoadFrom(string assemblyPath, bool dontLockAssemblyOnDisk = false)
        {
            throw new NotSupportedException("Loading an assembly from the file system is not supported in WASM");
        }
    }
}
