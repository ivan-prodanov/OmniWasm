using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace OmniSharp.Models
{
    public class Request : SimpleFileRequest
    {
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Line { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Column { get; set; }
        public string Buffer { get; set; }
        public IEnumerable<LinePositionSpanTextChange> Changes { get; set; }
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public bool ApplyChangesTogether { get; set; }
    }
}
