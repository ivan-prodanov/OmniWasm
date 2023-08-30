using System.Text.Json.Serialization;

namespace OmniSharp.Models.Events
{
    public class ErrorMessage
    {
        public string Text { get; set; }
        public string FileName { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Line { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Column { get; set; }
    }
}
