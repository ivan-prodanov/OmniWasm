using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace OmniWasm
{
    public class PerformanceMonitor : IDisposable
    {
        private const string NsString = "ns";
        private const string MicrosecondsString = "µs";
        private const string MilisecondsString = "ms";
        private string _description;
        private ILogger _logger;
        private LogLevel _overLimitLogLevel;
        private readonly long _limitMs;
        private readonly Stopwatch _stopwatch = new Stopwatch();

        public PerformanceMonitor(ILoggerFactory loggerFactory, string description, long limitMs = 0, LogLevel overLimitLogLevel = LogLevel.Warning)
        {
            _logger = loggerFactory.CreateLogger<PerformanceMonitor>();
            _limitMs = limitMs;
            _overLimitLogLevel = overLimitLogLevel;
            _description = description;
            _stopwatch.Start();
        }

        public void Dispose()
        {
            if (_stopwatch.IsRunning == true)
            {
                _stopwatch.Stop();

                string warning = String.Empty;

                // if the time elapsed is bigger than 1 second, generate a warning
                var overLimit = _limitMs > 0 ? _stopwatch.ElapsedMilliseconds > _limitMs : false;

                string timeDimension;
                string time;

                var ellapsedNanoSeconds = _stopwatch.ElapsedTicks * 1000000000 / Stopwatch.Frequency;
                if (ellapsedNanoSeconds < 10000)
                {
                    time = ellapsedNanoSeconds.ToString();
                    timeDimension = NsString;

                }
                else
                {
                    var ellapsedMicroseconds = _stopwatch.ElapsedTicks * 1000000 / Stopwatch.Frequency;
                    if (ellapsedMicroseconds < 10000)
                    {
                        time = ellapsedMicroseconds.ToString();
                        timeDimension = MicrosecondsString;
                    }
                    else
                    {
                        time = _stopwatch.ElapsedMilliseconds.ToString();
                        timeDimension = MilisecondsString;
                    }
                }

                _logger.Log(overLimit ? _overLimitLogLevel : LogLevel.Debug, $"[{time}{timeDimension}] {_description} ");
            }
        }
    }
}
