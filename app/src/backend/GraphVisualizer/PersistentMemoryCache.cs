using AngleSharp.Common;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace GraphVisualizer;

public class PersistentMemoryCache
{
    private readonly IMemoryCache _memoryCache;
    private readonly string _cacheFilePath;
    private readonly object _cacheLock = new();
    private readonly JsonSerializerOptions _jsonSerializerOptions = new() { WriteIndented = true };
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
            var cacheItems = new Dictionary<object, object>();
            foreach (object key in _keysToPersist)
            {
                if (_memoryCache.TryGetValue(key, out object? value))
                {
                    cacheItems[key] = value!;
                }
            }

            string json = JsonSerializer.Serialize(cacheItems, _jsonSerializerOptions);

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
                    var json = File.ReadAllText(_cacheFilePath);
                    var cacheItems = JsonSerializer.Deserialize<Dictionary<string, object>>(json);

                    if (cacheItems != null)
                    {
                        foreach (var item in cacheItems)
                        {
                            _memoryCache.Set(item.Key, item.Value);
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
}
