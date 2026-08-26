const seedDatabase = () => {
  const now = new Date().toISOString()
  const request = indexedDB.deleteDatabase('track-time-local')

  return new Cypress.Promise<void>((resolve, reject) => {
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const openRequest = indexedDB.open('track-time-local', 3)
      openRequest.onerror = () => reject(openRequest.error)
      openRequest.onupgradeneeded = () => {
        const database = openRequest.result
        const events = database.createObjectStore('events', { keyPath: 'id' })
        events.createIndex('datetime', 'datetime')
        events.createIndex('createdAt', 'createdAt')
        events.createIndex('updatedAt', 'updatedAt')

        const tags = database.createObjectStore('tags', { keyPath: 'id' })
        tags.createIndex('name', 'name', { unique: true })
        tags.createIndex('system', 'system')
        tags.createIndex('createdAt', 'createdAt')
        tags.createIndex('updatedAt', 'updatedAt')

        const orders = database.createObjectStore('tagEventOrder', {
          keyPath: 'id',
        })
        orders.createIndex('tagId', 'tagId')
        orders.createIndex('eventId', 'eventId')
        orders.createIndex('[tagId+sortOrder]', ['tagId', 'sortOrder'])
        orders.createIndex('[tagId+eventId]', ['tagId', 'eventId'])
        orders.createIndex('createdAt', 'createdAt')
        orders.createIndex('updatedAt', 'updatedAt')

        database.createObjectStore('tagOrder', { keyPath: 'id' })
      }
      openRequest.onsuccess = () => {
        const database = openRequest.result
        const transaction = database.transaction(
          ['events', 'tags', 'tagEventOrder', 'tagOrder'],
          'readwrite',
        )
        const event = {
          id: 'swipe-test-event',
          title: 'Swipe test event',
          datetime: now,
          seconds: true,
          minutes: true,
          hours: true,
          days: true,
          months: true,
          years: true,
          createdAt: now,
          updatedAt: now,
        }
        const allTag = {
          id: 'all',
          name: 'All',
          system: true,
          createdAt: now,
          updatedAt: now,
        }
        const firstTag = {
          id: 'first-tag',
          name: 'Alpha',
          system: false,
          createdAt: now,
          updatedAt: now,
        }
        const secondTag = {
          id: 'second-tag',
          name: 'Beta',
          system: false,
          createdAt: now,
          updatedAt: now,
        }

        transaction.objectStore('events').put(event)
        transaction.objectStore('tags').put(allTag)
        transaction.objectStore('tags').put(firstTag)
        transaction.objectStore('tags').put(secondTag)
        transaction.objectStore('tagOrder').put({
          id: 'custom',
          tagIds: [firstTag.id, secondTag.id],
        })
        transaction.objectStore('tagEventOrder').put({
          id: `all:${event.id}`,
          tagId: allTag.id,
          eventId: event.id,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        })
        transaction.objectStore('tagEventOrder').put({
          id: `${firstTag.id}:${event.id}`,
          tagId: firstTag.id,
          eventId: event.id,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        })
        transaction.oncomplete = () => {
          database.close()
          resolve()
        }
        transaction.onerror = () => reject(transaction.error)
      }
    }
  })
}

const dispatchTouch = (
  element: HTMLElement,
  type: 'touchstart' | 'touchmove' | 'touchend',
  clientX: number,
  clientY: number,
) => {
  const touch = new Touch({
    identifier: 0,
    target: element,
    clientX,
    clientY,
  })
  element.dispatchEvent(
    new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      changedTouches: type === 'touchend' ? [touch] : [],
      touches: type === 'touchend' ? [] : [touch],
    }),
  )
}

describe('Tag swipe navigation', () => {
  it('changes tags when swiping in empty space below an event', () => {
    cy.visit('/')
    cy.window().then(seedDatabase)
    cy.reload()

    cy.contains('button', 'Alpha').click()
    cy.get('[data-testid="tag-swipe-surface"]').should('be.visible')
    cy.contains('Swipe test event').should('be.visible')

    cy.get('[data-testid="tag-swipe-surface"]').then(($surface) => {
      const surface = $surface[0]
      const rect = surface.getBoundingClientRect()
      cy.get('[data-slot="card"]')
        .first()
        .then(($card) => {
          const cardRect = $card[0].getBoundingClientRect()
          const clientY = cardRect.bottom + 40
          expect(clientY).to.be.greaterThan(cardRect.bottom)
          expect(clientY).to.be.lessThan(rect.bottom)
          dispatchTouch(
            surface,
            'touchstart',
            rect.left + rect.width - 80,
            clientY,
          )
          dispatchTouch(surface, 'touchmove', rect.left + 80, clientY)
          dispatchTouch(surface, 'touchend', rect.left + 80, clientY)
        })
    })

    cy.contains('button', 'Beta').should('have.attr', 'aria-pressed', 'true')
  })
})
