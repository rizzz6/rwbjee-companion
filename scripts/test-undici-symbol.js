const symbolsPath = require.resolve('undici/lib/core/symbols');
const symbols = require(symbolsPath);

const cacheStoragePath = require.resolve('undici/lib/web/cache/cachestorage');
const cacheStorageModule = require(cacheStoragePath);

console.log('symbols.kConstruct:', symbols.kConstruct);
console.log('Type of symbols.kConstruct:', typeof symbols.kConstruct);

try {
  const c = new cacheStorageModule.CacheStorage(symbols.kConstruct);
  console.log('✅ Successfully constructed CacheStorage directly with symbols.kConstruct!');
} catch (e) {
  console.error('❌ Failed to construct CacheStorage directly:', e);
}

try {
  const undici = require('undici');
  console.log('✅ Successfully loaded undici!');
} catch (e) {
  console.error('❌ Failed to load undici:', e);
}
