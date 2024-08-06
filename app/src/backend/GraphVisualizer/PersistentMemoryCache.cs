using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;

namespace GraphVisualizer;

public class PersistentMemoryCache
{
    private readonly IMemoryCache _memoryCache;
    private readonly string _cacheFilePath;
    private readonly object _cacheLock = new();
    private readonly List<string> _keysToPersist;

    public PersistentMemoryCache(IMemoryCache memoryCache, string cacheFilePath, List<string> keysToPersist)
    {
        _memoryCache = memoryCache;
        _cacheFilePath = cacheFilePath;
        _keysToPersist = keysToPersist;

        LoadCacheFromDisk();
    }

    public bool TryGetValue<T>(object key, out T? value)
    {
        lock (_cacheLock)
        {
            return _memoryCache.TryGetValue(key, out value);
        }
    }

    public void Set<T>(object key, T value)
    {
        lock (_cacheLock)
        {
            _memoryCache.Set(key, value);
            SaveCacheToDisk();
        }
    }

    public void SaveCacheToDisk()
    {
        lock (_cacheLock)
        {
            Dictionary<string, CachedItem> cacheItems = [];

            foreach (string key in _keysToPersist)
            {
                if (_memoryCache.TryGetValue(key, out object? value))
                {
                    cacheItems[key.ToString()] = new CachedItem
                    {
                        Type = value!.GetType().AssemblyQualifiedName ?? string.Empty,
                        Value = JsonConvert.SerializeObject(value)
                    };
                }
            }

            string json = JsonConvert.SerializeObject(cacheItems, Formatting.Indented);

            File.WriteAllText(_cacheFilePath, json);
        }
    }


    private void LoadCacheFromDisk()
    {
        lock (_cacheLock)
        {
            try
            {
                if (File.Exists(_cacheFilePath))
                {
                    string json = File.ReadAllText(_cacheFilePath);
                    Dictionary<string, CachedItem>? cacheItems = JsonConvert.DeserializeObject<Dictionary<string, CachedItem>>(json);

                    if (cacheItems != null)
                    {
                        foreach (var item in cacheItems)
                        {
                            Type? type = Type.GetType(item.Value.Type);
                            if (type != null)
                            {
                                object? value = JsonConvert.DeserializeObject(item.Value.Value, type);
                                _memoryCache.Set(item.Key, value);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.StackTrace);
            }
        }
    }

    private class CachedItem
    {
        public required string Type { get; set; }
        public required string Value { get; set; }
    }
}