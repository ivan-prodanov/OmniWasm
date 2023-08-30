using System.Text.Json.Serialization;

namespace OmniSharp.Models.Navigate
{
    public class NavigateResponse
    {
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Line { get; set; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        public int Column { get; set; }
    }
}
