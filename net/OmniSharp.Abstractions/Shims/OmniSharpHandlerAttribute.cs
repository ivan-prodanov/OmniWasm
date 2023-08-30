using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OmniSharp
{
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
    public class OmniSharpHandlerAttribute : Attribute
    {
        public OmniSharpHandlerAttribute(string endpointName, string language)
        {

        }
    }
}
