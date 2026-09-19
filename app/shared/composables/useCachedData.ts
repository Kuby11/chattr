import type { NuxtApp } from '#app'
import { createUseAsyncData } from '#app/composables/asyncData'

const TTL_MS = 60_000
const CACHE_LIMIT = 100

type NuxtAppWithCacheMeta = NuxtApp & {
  _ttlCacheMeta?: Map<string, number>
}

function getMetaStore(nuxtApp: NuxtApp): Map<string, number> {
  const app = nuxtApp as NuxtAppWithCacheMeta
  if (!app._ttlCacheMeta) {
    app._ttlCacheMeta = new Map<string, number>()
  }
  return app._ttlCacheMeta
}

function touchKey(meta: Map<string, number>, key: string, expiresAt: number): void {
  meta.delete(key)
  meta.set(key, expiresAt)

  while (meta.size > CACHE_LIMIT) {
    const oldestKey = meta.keys().next().value
    if (oldestKey === undefined) break
    meta.delete(oldestKey)
  }
}

export const useCachedData = createUseAsyncData({
  getCachedData(key, nuxtApp) {
    const meta = getMetaStore(nuxtApp)
    const now = Date.now()
    const expiresAt = meta.get(key)

    const cachedValue = nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]

    const isFresh = expiresAt !== undefined && now <= expiresAt
    const hasData = cachedValue !== undefined

    if (isFresh && hasData) {
      touchKey(meta, key, expiresAt as number)
      return cachedValue
    }

    touchKey(meta, key, now + TTL_MS)

    return undefined
  },
})
