describe('Home Page', () => {
  it('should load the home page', () => {
    cy.visit('/event')
    cy.contains('button', 'Create Event')
  })

  it('opens a created event without leaving the edit form unavailable', () => {
    const title = `Navigation test ${Date.now()}`

    cy.visit('/event')
    cy.get('#title').type(title)
    cy.get('#date').type('2025-01-01')
    cy.contains('button', 'Create Event').click()

    cy.url().should('match', /\/$/)
    cy.contains(title).click()
    cy.url().should('match', /\/event\/[^/]+$/)
    cy.get('#title').should('have.value', title)
    cy.contains('Loading...').should('not.exist')
  })
})
