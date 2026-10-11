namespace InventoryProxy.Inventory;

/// <summary>Counters that show how many calls the proxy saved.</summary>
public static class ProxyStats
{
    private static long _remoteCalls, _cacheHits, _cacheMisses;

    public static long RemoteCalls => Interlocked.Read(ref _remoteCalls);
    public static long CacheHits => Interlocked.Read(ref _cacheHits);
    public static long CacheMisses => Interlocked.Read(ref _cacheMisses);

    public static void RecordRemoteCall() => Interlocked.Increment(ref _remoteCalls);
    public static void RecordCacheHit() => Interlocked.Increment(ref _cacheHits);
    public static void RecordCacheMiss() => Interlocked.Increment(ref _cacheMisses);

    public static void Reset()
    {
        Interlocked.Exchange(ref _remoteCalls, 0);
        Interlocked.Exchange(ref _cacheHits, 0);
        Interlocked.Exchange(ref _cacheMisses, 0);
    }
}
