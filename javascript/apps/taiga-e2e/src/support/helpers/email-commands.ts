/*
  before(() => {
    cy.origin('https://ethereal.email', initEmailCommands);
  });

  ...

  cy.origin('https://ethereal.email', { args: {} }, () => {
      cy.getBySelEmail('selector').click();
  });
*/

export const initEmailCommands = () => {
  const getIframeDocument = () => {
    return cy.get('iframe').its('0.contentDocument').should('exist');
  };

  function getIframeBody() {
    return getIframeDocument()
      .its('body')
      .should('not.be.undefined')
      .then(cy.wrap);
  }

  function getBySelEmail(selector: string, options?: CyGetOptions[1]) {
    return getIframeBody().find(`[data-test=${selector}]`, options);
  }

  Cypress.Commands.add('getBySelEmail', getBySelEmail);
};
