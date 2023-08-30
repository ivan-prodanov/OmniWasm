using Microsoft.Extensions.Logging;
using OmniSharp.Eventing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OmniWasm
{
    class NullEventEmitter : IEventEmitter
    {
        private readonly ILogger<NullEventEmitter> _logger;

        public NullEventEmitter(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<NullEventEmitter>();
        }
        public void Emit(string kind, object args)
        {
            _logger.LogTrace($"TODO implement event emitter. Event: {kind} Args: {args}");
        }
    }
}
