// Shim to fix Undici "Illegal constructor" error on Windows with Node 20+
if (typeof global !== 'undefined') {
  try {
    // 1. Force override global caches to bypass native caches
    const mockCaches = {
      open: () => Promise.resolve({}),
      keys: () => Promise.resolve([]),
      has: () => Promise.resolve(false),
      delete: () => Promise.resolve(false),
      match: () => Promise.resolve(undefined),
    };

    Object.defineProperty(global, 'caches', {
      value: mockCaches,
      writable: true,
      configurable: true,
      enumerable: true
    })
    
    Object.defineProperty(globalThis, 'caches', {
      value: mockCaches,
      writable: true,
      configurable: true,
      enumerable: true
    })

    // 2. Intercept CacheStorage module to fix Symbol(kConstruct) mismatch during tsx/ts-node transpilation
    const cacheStoragePath = require.resolve('undici/lib/web/cache/cachestorage')
    const originalCacheStorageModule = require(cacheStoragePath)
    
    const symbolsPath = require.resolve('undici/lib/core/symbols')
    const symbols = require(symbolsPath)
    
    class PatchedCacheStorage extends originalCacheStorageModule.CacheStorage {
      constructor(...args) {
        // Always pass the correct kConstruct symbol from the same module's path context
        super(symbols.kConstruct)
      }
    }

    // Set toStringTag on prototype to ensure brand checks succeed
    Object.defineProperty(PatchedCacheStorage.prototype, Symbol.toStringTag, {
      value: 'CacheStorage',
      configurable: true
    })

    // Replace the exports in Node's require.cache
    require.cache[cacheStoragePath].exports = {
      CacheStorage: PatchedCacheStorage
    }
    
    console.log('🩹 Successfully patched Undici CacheStorage symbol mismatch!')
  } catch (e) {
    console.error('⚠️ Failed to apply Undici CacheStorage shim:', e)
  }
}
