using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OmniWasm
{
    internal class WebAssemblyConsoleLogger<T> : ILogger<T>, ILogger
    {
        private static readonly string _loglevelPadding = " ";
        private static readonly string _messagePadding;
        private static readonly string _newLineWithMessagePadding;
        private static readonly StringBuilder _logBuilder = new StringBuilder();

        private readonly string _name;

        static WebAssemblyConsoleLogger()
        {
            var logLevelString = GetLogLevelString(LogLevel.Information);
            _messagePadding = new string(' ', logLevelString.Length + _loglevelPadding.Length);
            _newLineWithMessagePadding = Environment.NewLine + _messagePadding;
        }

        public WebAssemblyConsoleLogger(string name)
        {
            _name = name ?? throw new ArgumentNullException(nameof(name));
        }

        public IDisposable BeginScope<TState>(TState state)
        {
            return NoOpDisposable.Instance;
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            return logLevel != LogLevel.None;
        }

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
        {
            if (!IsEnabled(logLevel))
            {
                return;
            }

            if (formatter == null)
            {
                throw new ArgumentNullException(nameof(formatter));
            }

            var message = formatter(state, exception);

            if (!string.IsNullOrEmpty(message) || exception != null)
            {
                WriteMessage(logLevel, _name, eventId.Id, message, exception);
            }
        }

        private void WriteMessage(LogLevel logLevel, string logName, int eventId, string message, Exception exception)
        {
            lock (_logBuilder)
            {
                try
                {
                    CreateDefaultLogMessage(_logBuilder, logLevel, logName, eventId, message, exception);
                    var formattedMessage = _logBuilder.ToString();
                    var logLevelStyle = $"{logLevelStyleMap[logLevel]};font-weight:bold";
                    var logNameStyle = $"color:#888";
                    var messageStyle = $"padding-top:2px;color:#fff";

                    switch (logLevel)
                    {
                        case LogLevel.Trace:
                        case LogLevel.Debug:
                            Interop.Runtime.InvokeJS($"console.log(`{formattedMessage}`, '{logLevelStyle}', '{logNameStyle}', '{messageStyle}')", out _);
                            break;
                        case LogLevel.Information:
                            Interop.Runtime.InvokeJS($"console.log(`{formattedMessage}`, '{logLevelStyle}', '{logNameStyle}', '{messageStyle}')", out _);
                            break;
                        case LogLevel.Warning:
                            Interop.Runtime.InvokeJS($"console.log(`{formattedMessage}`, '{logLevelStyle}', '{logNameStyle}', '{messageStyle}')", out _);
                            break;
                        case LogLevel.Error:
                            Interop.Runtime.InvokeJS($"console.log(`{formattedMessage}`, '{logLevelStyle}', '{logNameStyle}', '{messageStyle}')", out _);
                            break;
                        case LogLevel.Critical:
                            Interop.Runtime.InvokeJS($"console.log(`{formattedMessage}`, '{logLevelStyle}', '{logNameStyle}', '{messageStyle}')", out _);
                            break;
                        default: // LogLevel.None or invalid enum values
                            Interop.Runtime.InvokeJS($"console.log(`{formattedMessage}`, '{logLevelStyle}', '{logNameStyle}', '{messageStyle}')", out _);
                            break;
                    }
                }
                finally
                {
                    _logBuilder.Clear();
                }
            }
        }

        private void CreateDefaultLogMessage(StringBuilder logBuilder, LogLevel logLevel, string logName, int eventId, string message, Exception exception)
        {
            logBuilder.Append("%c");
            logBuilder.Append(GetLogLevelString(logLevel));
            logBuilder.Append("%c");
            logBuilder.Append(_loglevelPadding);
            logBuilder.Append(logName);
            logBuilder.Append("%c");

            if (!string.IsNullOrEmpty(message))
            {
                // message
                logBuilder.AppendLine();
                logBuilder.Append(_messagePadding);

                var len = logBuilder.Length;
                logBuilder.Append(message);
                logBuilder.Replace(Environment.NewLine, _newLineWithMessagePadding, len, message.Length);
            }

            // Example:
            // System.InvalidOperationException
            //    at Namespace.Class.Function() in File:line X
            if (exception != null)
            {
                // exception message
                logBuilder.AppendLine();
                logBuilder.Append(exception.ToString());
            }
        }

        private static string GetLogLevelString(LogLevel logLevel)
        {
            switch (logLevel)
            {
                case LogLevel.Trace:
                    return "Trce";
                case LogLevel.Debug:
                    return "Dbug";
                case LogLevel.Information:
                    return "Info";
                case LogLevel.Warning:
                    return "Warn";
                case LogLevel.Error:
                    return "Fail";
                case LogLevel.Critical:
                    return "CRIT";
                default:
                    throw new ArgumentOutOfRangeException(nameof(logLevel));
            }
        }

        private readonly Dictionary<LogLevel, string> logLevelStyleMap = new Dictionary<LogLevel, string>
        {
            [LogLevel.Trace] = "color: #777",
            [LogLevel.Debug] = "color: #aaa",
            [LogLevel.Information] = "color: #fff",
            [LogLevel.Warning] = "color: yellow",
            [LogLevel.Error] = "color: red",
            [LogLevel.Critical] = "color: white; background: red",
        };

        private class NoOpDisposable : IDisposable
        {
            public static NoOpDisposable Instance = new NoOpDisposable();

            public void Dispose() { }
        }
    }
}
