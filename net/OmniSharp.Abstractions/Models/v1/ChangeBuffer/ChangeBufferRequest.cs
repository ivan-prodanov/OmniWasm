using OmniSharp.Mef;
using System.Text.Json.Serialization;

namespace OmniSharp.Models.ChangeBuffer
{
    [OmniSharpEndpoint(OmniSharpEndpoints.ChangeBuffer, typeof(ChangeBufferRequest), typeof(object))]
    public class ChangeBufferRequest : IRequest
    {
        public string FileName { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int StartLine { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int StartColumn { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int EndLine { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int EndColumn { get; set; }
        public string NewText { get; set; }
    }
}
