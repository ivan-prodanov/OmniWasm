using OmniSharp.Models.Metadata;
using System.Text.Json.Serialization;

namespace OmniSharp.Models.GotoDefinition
{
    public class GotoDefinitionResponse : ICanBeEmptyResponse
    {
        public string FileName { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Line { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Column { get; set; }
        public MetadataSource MetadataSource { get; set; }
        public bool IsEmpty => string.IsNullOrWhiteSpace(FileName) && MetadataSource == null;
    }
}
