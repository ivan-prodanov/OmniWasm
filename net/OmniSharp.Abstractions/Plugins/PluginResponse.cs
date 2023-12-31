using System;
using System.Text.Json;

namespace OmniSharp.Plugins
{
    class PluginResponse
    {
        public static PluginResponse Parse(string json)
        {
            using var obj = JsonDocument.Parse(json);
            var result = obj.ToObject<PluginResponse>();

            if (result.Request_seq <= 0)
            {
                throw new ArgumentException("invalid seq-value");
            }

            if (string.IsNullOrWhiteSpace(result.Command))
            {
                throw new ArgumentException("missing command");
            }

            JsonElement arguments;
            if (obj.RootElement.TryGetProperty("body", out arguments))
            {
                result.BodyJson = arguments.ToString();
            }
            else
            {
                result.BodyJson = string.Empty;
            }
            return result;
        }

        public int Request_seq { get; set; }

        public string Command { get; set; }

        public string BodyJson { get; set; }

        public bool Running { get; set; }

        public bool Success { get; set; }

        public string Message { get; set; }
    }
}
