using OmniSharp.Mef;
using System.Text.Json.Serialization;

namespace OmniSharp.Models.Format
{
    [OmniSharpEndpoint(OmniSharpEndpoints.FormatRange, typeof(FormatRangeRequest), typeof(FormatRangeResponse))]
    public class FormatRangeRequest : Request
    {
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int EndLine { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int EndColumn { get; set; }
    }
}
