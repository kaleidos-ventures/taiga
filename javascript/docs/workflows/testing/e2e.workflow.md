For e2e testing we will use Cypress. [Read the Cypress doc thorughly](https://docs.cypress.io/guides/getting-started/writing-your-first-test)

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

Cypress comes with its own [commands](https://docs.cypress.io/api/commands/click). You can create or overwrite existing commands.
To create a new custom command add it to `src/taiga-e2e/src/support/commands`

Example command

```js
function loginCommand(email, password) {
  console.log('Custom command example: Login', email, password);
}

Cypress.Commands.add('login', loginCommand);

declare namespace Cypress {
  interface Chainable {
    login: typeof loginCommand
  }
}
```

And use it as follows:

```js
cy.login('my-email@something.com', 'myPassword');
```

## Selectors

Use `getBySel` instead of get:

```ts
cy.get('[data-e2e=add-workspace-button]').click();

// Use this
cy.getBySel('add-workspace-button').click();
```

## Login

## Helpers

Helpers are functions containing one or multiple commands that avoid repetition. Think of it as functions.
To create a new helper add it to `src/taiga-e2e/src/support/helpers`

Example helper

```js
export const getGreeting = () => cy.get('h1');
```

And use it as follows:

```js
getGreeting().contains('Welcome to taiga!');
```

## Fixtures

Fixtures are fake data that can be used to fill our tests. To generate this data we will use [falso](https://github.com/ngneat/falso).

Create a new file under `src/taiga-e2e/src/fixtures` named `${dataName}.fixture.ts`. You can use the mock models when it's possible.

```ts
import { randFirstName, randEmail, randPassword } from '@ngneat/falso';

export const exampleFixture = () => {
  return {
    name: randFirstName(),
    email: randEmail(),
    password: randPassword(),
  };
};
```

## A11y

Init axe.

```ts
beforeEach(() => {
  cy.visit('/');
  cy.initAxe();
});
```

Run axe tests

```ts
it('is a11y', () => {
  cy.tgCheckA11y();
});
```

And import it to your integration test to fill the data.

## Log of a count.

If you want to log a count of an amount of items you should do it like this

```ts
// First you create a variable with Cypress
cy.get('[data-e2e=workspace-item]').its('length').as('workspaceItemCount');

// Then you call it returning an string
cy.get<string>('@workspaceItemCount').then((previousCount) => {
  cy.log(previousCount);
});
```

## Logs

UI log `cy.log('test');`
Console log `cy.task('log', 'test');`

## Intercept api request

Log api responses

```ts
cy.intercept('http://localhost:8000/api/v2/auth/token').as('loginRequest');

cy.login();

cy.wait('@loginRequest').should((xhr) => {
  cy.task('log', xhr.response?.body);
});
```

## Full example of e2e test

```ts
import { exampleFixture } from '../fixtures/example.fixture';
import { getGreeting } from '@test/helpers/app.po';

describe('taiga', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cy.initAxe();
  });

  it('is a11y', () => {
    cy.tgCheckA11y();
  });

  it('should display welcome message', () => {
    getGreeting().contains('Welcome to taiga!');

    cy.getBySel('open').click();
  });
});
```

## Intercept email

The email server should be running `npm run email:serve`

Setup:

```ts
import { initEmailCommands } from '@test/helpers/email-commands';

before(() => {
  // this is for using the `initEmailCommands` in the email window
  cy.origin('http://localhost:3000', initEmailCommands);
});
```

Use:

```ts
getEmailsPreviews().then((response) => {
  // get last email
  const email =
    response.body.emails[response.body.emails.length - 1].localPreview;

  // visit & interact with the email
  cy.origin('http://localhost:3000', { args: email }, (email) => {
    cy.visit(email);
    cy.getBySelEmail('example').click();
  });
});
```

## Run

```sh
npm run e2e
npm run e2e -- --watch
```

## Database fixtures backup

Please, follow the step described in `.github/sql-fixtures/README.md`
