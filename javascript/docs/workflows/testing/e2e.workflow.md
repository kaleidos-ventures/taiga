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

Fixtures are fake data that can be used to fill our tests. To generate this data we will use [faker](https://github.com/marak/Faker.js/).

Create a new file under `src/taiga-e2e/src/fixtures` named `${dataName}.fixture.ts`

```ts
import * as faker from 'faker';

faker.seed(6443);

export const exampleFixture = {
  name: faker.name.firstName(),
  email: faker.internet.email(),
  password: faker.internet.password();
  userStorySubject: faker.lorem.sentence()
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

## Full example of e2e test

```ts
import { exampleFixture } from '../fixtures/example.fixture';
import { getGreeting } from '../support/helpers/app.po';

describe('taiga', () => {
  beforeEach(() => cy.visit('/'));

  xit('should display welcome message', () => {
    cy.login(exampleFixture.email , exampleFixture.name);
    getGreeting().contains('Welcome to taiga!');
  });
});
```


## Log of a count.

If you want to log a count of an amount of items you should do it like this

```ts
// First you create a variable with Cypress
cy.get('[data-e2e=workspace-item]').its('length').as('workspaceItemCount');

// Then you call it returning an string
cy.get<string>('@workspaceItemCount').then(previousCount => {
  cy.log(previousCount);
});
```

## Run

```sh
npm run e2e
npm run e2e -- --watch
```
