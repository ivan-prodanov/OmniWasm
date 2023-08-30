using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OmniSharp.FileWatching
{
    public class NullFileSystemWatcher : IFileSystemWatcher, IFileSystemNotifier
    {
        public void Notify(string filePath, FileChangeType changeType = FileChangeType.Unspecified)
        {
        }

        public void Watch(string pathOrExtension, FileSystemNotificationCallback callback)
        {
        }

        public void WatchDirectories(FileSystemNotificationCallback callback)
        {
        }
    }
}
