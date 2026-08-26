describe('Home Page', () => {
  it('should load the home page', () => {
    cy.visit('/event')
    cy.contains('button', 'Create Event')
  })
})
