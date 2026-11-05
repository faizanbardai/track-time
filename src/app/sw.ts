import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist, type RouteHandlerCallbackOptions } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^tag$/],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
})

serwist.registerCapture(
  ({ request }) => request.mode === 'navigate',
  async ({ request }: RouteHandlerCallbackOptions) => {
    try {
      const response = await fetch(request)
      if (response.status >= 500) {
        const offlinePage = await serwist.matchPrecache('/~offline')
        if (offlinePage) return offlinePage
      }
      return response
    } catch (error) {
      const offlinePage = await serwist.matchPrecache('/~offline')
      if (offlinePage) return offlinePage
      throw error
    }
  },
)

defaultCache.forEach(({ matcher, handler, method }) => {
  serwist.registerCapture(matcher, handler, method)
})

serwist.addEventListeners()
