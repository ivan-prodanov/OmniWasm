using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OmniWasm
{
    internal class WebAssemblyConsoleLoggerProvider : ILoggerProvider
    {
        private readonly ConcurrentDictionary<string, WebAssemblyConsoleLogger<object>> _loggers;

        /// <summary>
        /// Creates an instance of <see cref="WebAssemblyConsoleLoggerProvider"/>.
        /// </summary>
        public WebAssemblyConsoleLoggerProvider()
        {
            _loggers = new ConcurrentDictionary<string, WebAssemblyConsoleLogger<object>>();
        }

        /// <inheritdoc />
        public ILogger CreateLogger(string name)
        {
            return _loggers.GetOrAdd(name, loggerName => new WebAssemblyConsoleLogger<object>(name));
        }

        /// <inheritdoc />
        public void Dispose()
        {
        }
    }
}
