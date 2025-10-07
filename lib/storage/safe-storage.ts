/**
 * Safe Browser Storage Utilities
 *
 * Provides defensive wrappers around Web Storage APIs so that
 * Zustand persistence does not crash when storage is unavailable
 * (e.g. server-side rendering, Safari private mode, quota limits).
 */

type StorageType = 'local' | 'session'

const MEMORY_PREFIX = '__lxnotes_memory__'
const memoryStores = new Map<string, MemoryStorage>()

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys())
    return keys[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

const warnedStorages = new Set<string>()

const warnOnce = (storageName: string, storageType: StorageType, error: unknown) => {
  const key = `${storageType}:${storageName}`
  if (warnedStorages.has(key)) {
    return
  }
  warnedStorages.add(key)
  // eslint-disable-next-line no-console
  console.warn(`[storage] Falling back to in-memory storage for "${storageName}" (${storageType}Storage)`, error)
}

class SafeStorage implements Storage {
  constructor(
    private primary: Storage,
    private storageName: string,
    private storageType: StorageType,
    private memory: MemoryStorage
  ) {}

  get length(): number {
    const keys = new Set<string>()

    for (let i = 0; i < this.primary.length; i++) {
      const key = this.primary.key(i)
      if (key) {
        keys.add(key)
      }
    }

    for (let i = 0; i < this.memory.length; i++) {
      const key = this.memory.key(i)
      if (key) {
        keys.add(key)
      }
    }

    return keys.size
  }

  clear(): void {
    try {
      this.primary.clear()
    } catch (error) {
      warnOnce(this.storageName, this.storageType, error)
    }
    this.memory.clear()
  }

  getItem(key: string): string | null {
    const memoryValue = this.memory.getItem(key)
    if (memoryValue !== null) {
      return memoryValue
    }

    try {
      return this.primary.getItem(key)
    } catch (error) {
      warnOnce(this.storageName, this.storageType, error)
      return null
    }
  }

  key(index: number): string | null {
    try {
      return this.primary.key(index)
    } catch (error) {
      warnOnce(this.storageName, this.storageType, error)
      return this.memory.key(index)
    }
  }

  removeItem(key: string): void {
    try {
      this.primary.removeItem(key)
    } catch (error) {
      warnOnce(this.storageName, this.storageType, error)
    }
    this.memory.removeItem(key)
  }

  setItem(key: string, value: string): void {
    try {
      this.primary.setItem(key, value)
    } catch (error) {
      warnOnce(this.storageName, this.storageType, error)
    }
    this.memory.setItem(key, value)
  }
}

const getMemoryStorage = (storageName: string, storageType: StorageType): MemoryStorage => {
  const key = `${storageType}:${storageName}`
  let memory = memoryStores.get(key)
  if (!memory) {
    memory = new MemoryStorage()
    memoryStores.set(key, memory)
  }
  return memory
}

const createMemoryStorage = (storageName: string, storageType: StorageType): Storage => {
  const memory = getMemoryStorage(storageName, storageType)
  // Seed with namespace so key collisions between stores are unlikely
  memory.setItem(`${MEMORY_PREFIX}:${storageName}:init`, '1')
  memory.removeItem(`${MEMORY_PREFIX}:${storageName}:init`)
  return memory
}

export function createSafeStorage(storageName: string, storageType: StorageType): Storage {
  if (typeof window === 'undefined') {
    return createMemoryStorage(storageName, storageType)
  }

  const memory = getMemoryStorage(storageName, storageType)

  try {
    const primary = storageType === 'session'
      ? window.sessionStorage
      : window.localStorage

    // Verify that storage is usable (avoids quota and privacy mode issues)
    const testKey = `${MEMORY_PREFIX}:${storageName}:test`
    primary.setItem(testKey, '1')
    primary.removeItem(testKey)

    return new SafeStorage(primary, storageName, storageType, memory)
  } catch (error) {
    warnOnce(storageName, storageType, error)
    return memory
  }
}
