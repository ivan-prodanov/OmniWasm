using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OmniWasm
{
    public class NullOptionsMonitor<T> : IDisposable, IOptionsMonitor<T> where T : class, new()
    {
        public NullOptionsMonitor(T currentValue)
        {
            CurrentValue = currentValue;
        }

        public T Get(string name)
        {
            return CurrentValue;
        }

        public IDisposable OnChange(Action<T, string> listener)
        {
            return this;
        }

        public void Dispose()
        {
        }

        public T CurrentValue { get; }
    }
}
