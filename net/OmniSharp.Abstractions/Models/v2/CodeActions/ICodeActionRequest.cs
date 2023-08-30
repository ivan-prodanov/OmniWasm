using System.Text.Json.Serialization;

namespace OmniSharp.Models.V2.CodeActions
{
    public interface ICodeActionRequest
    {
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        int Line { get; }
        [JsonConverter(typeof(ZeroBasedIndexIntConverter))]
        int Column { get; }
        string Buffer { get; }
        string FileName { get; }
        Range Selection { get; }
    }
}
