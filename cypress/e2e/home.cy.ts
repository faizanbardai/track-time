describe('Home Page', () => {
  it('should load the home page', () => {
    cy.visit('http://localhost:3000/event')
    cy.contains('Create a new event')
  })
})
