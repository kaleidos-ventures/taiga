## e2e testing

To create a e2e test, first create a new file on `src/taiga-e2e/src/integration`

A simple test structure example
```js
describe('example', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    const title = cy.get('h1');
    title.contains('Welcome to taiga!');
  });
});
```

## Custom commands

Cypress comes with its own API. if you want to create or overwrite existing commands.
To create a new custom command add it to `src/taiga-e2e/src/support/commands`

Example command

```js
Cypress.Commands.add('login', (email, password) => {
  console.log('Custom command example: Login', email, password);
});
```




