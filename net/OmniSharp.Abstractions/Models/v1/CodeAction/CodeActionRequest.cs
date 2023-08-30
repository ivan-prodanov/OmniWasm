using System.Text.Json.Serialization;

namespace OmniSharp.Models.CodeAction
{
    public abstract class CodeActionRequest : Request
    {
        public int CodeAction { get; set; }
        public bool WantsTextChanges { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int? SelectionStartColumn { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int? SelectionStartLine { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int? SelectionEndColumn { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int? SelectionEndLine { get; set; }
    }
}
