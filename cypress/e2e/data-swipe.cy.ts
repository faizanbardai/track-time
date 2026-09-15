const sendTouch = (
  element: HTMLElement,
  type: 'touchstart' | 'touchmove' | 'touchend',
  x: number,
) => {
  const touch = new Touch({
    identifier: 0,
    target: element,
    clientX: x,
    clientY: element.getBoundingClientRect().top + 20,
  })
  element.dispatchEvent(
    new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: type === 'touchend' ? [] : [touch],
      changedTouches: [touch],
    }),
  )
}

describe('Backup and restore pager', () => {
  beforeEach(() => {
    cy.viewport(390, 844)
    cy.visit('/data')
    cy.get('#export-password').should('be.visible')
  })

  it('fits the viewport, keeps a gap during swipes, and settles at the viewport edge', () => {
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollHeight).to.be.at.most(844)
    })
    cy.get('[data-testid="backup-swipe-surface"]').then(($surface) => {
      const surface = $surface[0]
      sendTouch(surface, 'touchstart', 300)
      sendTouch(surface, 'touchmove', 160)
    })
    cy.get('#data-backup-panel').then(($backup) => {
      cy.get('#data-restore-panel').then(($restore) => {
        const gap =
          $restore[0].getBoundingClientRect().left -
          $backup[0].getBoundingClientRect().right
        expect(gap).to.be.closeTo(12, 0.1)
      })
    })
    cy.get('[data-testid="backup-swipe-surface"]').then(($surface) => {
      sendTouch($surface[0], 'touchend', 160)
    })
    cy.get('#data-restore-panel').should('have.attr', 'aria-hidden', 'false')
    cy.get('[data-testid="backup-swipe-surface"]').then(($surface) => {
      cy.get('#data-restore-panel').should(($panel) => {
        expect($panel[0].getBoundingClientRect().left).to.be.closeTo(
          $surface[0].getBoundingClientRect().left,
          0.1,
        )
      })
    })
  })

  it('preserves passwords and the selected file when switching with pills', () => {
    cy.get('#export-password').type('test password')
    cy.get('#data-restore-tab').click()
    cy.get('#backup-file').selectFile({
      contents: Cypress.Buffer.from('{}'),
      fileName: 'test-backup.json',
      mimeType: 'application/json',
    })
    cy.get('#import-password').type('restore password')
    cy.get('#data-backup-tab').click()
    cy.get('#export-password').should('have.value', 'test password')
    cy.get('#data-restore-tab').click()
    cy.get('#import-password').should('have.value', 'restore password')
    cy.get('#backup-file').should(($input) => {
      expect(($input[0] as HTMLInputElement).files?.[0]?.name).to.equal(
        'test-backup.json',
      )
    })
  })
})
