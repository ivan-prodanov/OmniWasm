using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OmniWasm
{
    public class AssemblyListProvider
    {
        public IEnumerable<string> GetAssemblyNamesList()
        {
            var appDomainAssemblies = AppDomain.CurrentDomain.GetAssemblies();

            var assemblies = appDomainAssemblies
                .Where(x => !x.IsDynamic)
                .Select(x => x.GetName().Name)
                .Where(x => string.IsNullOrEmpty(x) == false)
                .Select(x => $"{x}.dll")
                .ToList();

            return assemblies;
        }
    }
}
