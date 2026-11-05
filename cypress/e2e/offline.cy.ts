describe('offline app shell', () => {
  it('precaches routes and opens a local event through offline fallback', () => {
    const title = `Offline event ${Date.now()}`

    cy.visit('/event')
    cy.window().then(async (window) => {
      await window.navigator.serviceWorker.ready
    })
    cy.reload()
    cy.window().should((window) => {
      expect(Boolean(window.navigator.serviceWorker.controller)).to.equal(true)
    })
    cy.window().then(async (window) => {
      const cacheName = (await window.caches.keys()).find((name) =>
        name.includes('precache'),
      )
      if (!cacheName) throw new Error('Service worker precache was not created')

      const cache = await window.caches.open(cacheName)
      const cachedPaths = (await cache.keys()).map(
        (request) => new URL(request.url).pathname,
      )

      expect(cachedPaths).to.include.members([
        '/',
        '/event',
        '/tags',
        '/data',
        '/~offline',
      ])
      expect(
        cachedPaths.some((path) =>
          path.startsWith('/_next/static/chunks/app/'),
        ),
      ).to.equal(true)
    })

    cy.get('#title').type(title)
    cy.get('#date').type('2025-01-01')
    cy.contains('button', 'Create Event').click()
    cy.url().should('match', /\/$/)

    cy.window()
      .then(
        (window) =>
          new Promise<string>((resolve, reject) => {
            const request = window.indexedDB.open('track-time-local')
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
              const database = request.result
              const transaction = database.transaction('events', 'readonly')
              const eventsRequest = transaction.objectStore('events').getAll()
              eventsRequest.onsuccess = () => {
                const event = eventsRequest.result.find(
                  (record) => record.title === title,
                )
                if (!event) {
                  reject(new Error('Created event was not saved to IndexedDB'))
                  return
                }
                resolve(event.id)
              }
              eventsRequest.onerror = () => reject(eventsRequest.error)
              transaction.oncomplete = () => database.close()
              transaction.onerror = () => reject(transaction.error)
            }
          }),
      )
      .as('eventId')

    cy.get('@eventId').then((eventId) => {
      cy.then(() =>
        Cypress.automation('remote:debugger:protocol', {
          command: 'Network.enable',
        }),
      )
      cy.then(() =>
        Cypress.automation('remote:debugger:protocol', {
          command: 'Network.emulateNetworkConditions',
          params: {
            offline: true,
            latency: 0,
            downloadThroughput: 0,
            uploadThroughput: 0,
            connectionType: 'none',
          },
        }),
      )
      cy.window().should((window) => {
        expect(window.navigator.onLine).to.equal(false)
      })
      cy.window().then((window) => window.location.assign(`/event/${eventId}`))
      cy.get('#title').should('have.value', title)
      cy.get('#event-form').should('be.visible')

      cy.window().then((window) =>
        window.location.assign(`/unvisited-page-${Date.now()}`),
      )
      cy.contains('You’re offline').should('be.visible')
    })
  })
})
