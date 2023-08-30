using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OmniSharp.Models
{
    public class ZeroBasedIndexIntConverter : JsonConverter<int?>
    {
        public override int? Read(ref Utf8JsonReader reader, Type objectType, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return default;

            if (Configuration.ZeroBasedIndices)
            {
                return (int?)JsonSerializer.Deserialize(ref reader, objectType);
            }

            var deserializedValue = JsonSerializer.Deserialize<int?>(ref reader);
            if (objectType == typeof(int?))
            {
                deserializedValue = deserializedValue.Value - 1;
                return deserializedValue.Value;
            }

            if (deserializedValue.HasValue)
            {
                return deserializedValue.Value - 1;
            }

            return default;
        }

        public override void Write(Utf8JsonWriter writer, int? value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                JsonSerializer.Serialize(writer, null);
                return;
            }

            if (Configuration.ZeroBasedIndices)
            {
                JsonSerializer.Serialize(writer, value);
                return;
            }

            var objectType = value.GetType();
            if (objectType == typeof(int?))
            {
                var nullable = (int?)value;
                if (nullable.HasValue)
                {
                    nullable = nullable.Value + 1;
                }
                value = nullable;
            }
            else if (objectType == typeof(int))
            {
                var intValue = (int)value;
                value = intValue + 1;
            }

            JsonSerializer.Serialize(writer, value);
        }
    }

    class ZeroBasedIndexIntArrayConverter : JsonConverter<int[]>
    {
        public override int[] Read(ref Utf8JsonReader reader, Type objectType, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return default;

            if (Configuration.ZeroBasedIndices)
            {
                return (int[])JsonSerializer.Deserialize(ref reader, objectType);
            }

            if (objectType == typeof(int[]))
            {
                var results = JsonSerializer.Deserialize<int[]>(ref reader);
                for (var i = 0; i < results.Length; i++)
                {
                    results[i] = results[i] - 1;
                }
                return results;
            }

            return default;
        }

        public override void Write(Utf8JsonWriter writer, int[] value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                JsonSerializer.Serialize(writer, null);
                return;
            }

            if (Configuration.ZeroBasedIndices)
            {
                JsonSerializer.Serialize(writer, value);
                return;
            }

            var objectType = value.GetType();
            if (objectType == typeof(int[]))
            {
                var results = (int[])value;
                for (var i = 0; i < results.Length; i++)
                {
                    results[i] = results[i] + 1;
                }
            }

            JsonSerializer.Serialize(writer, value);
        }
    }

    class ZeroBasedIndexIntEnumerableConverter : JsonConverter<IEnumerable<int>>
    {
        public override IEnumerable<int> Read(ref Utf8JsonReader reader, Type objectType, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return default;

            if (Configuration.ZeroBasedIndices)
            {
                return (int[])JsonSerializer.Deserialize(ref reader, objectType);
            }

            if (objectType == typeof(IEnumerable<int>))
            {
                var results = JsonSerializer.Deserialize<IEnumerable<int>>(ref reader);
                return results.Select(x => x - 1);
            }

            return default;
        }

        public override void Write(Utf8JsonWriter writer, IEnumerable<int> value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                JsonSerializer.Serialize(writer, null);
                return;
            }

            if (Configuration.ZeroBasedIndices)
            {
                JsonSerializer.Serialize(writer, value);
                return;
            }

            var objectType = value.GetType();
            if (objectType == typeof(IEnumerable<int>))
            {
                var results = value;
                value = results.Select(x => x + 1);
            }

            JsonSerializer.Serialize(writer, value);
        }
    }
}
