# Test commands

```bash
# Run all test suit
npm run test

# Run especific file test
npm run test -- --test-file input.component.spec.ts
```

# Component Testing

For testing we're using [spectator](https://github.com/ngneat/spectator). This is the test of the previous service example.

```ts
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { ExampleComponent } from './example.component';
import { ExampleModule } from './example.module';

describe('ButtonComponent', () => {
  let spectator: Spectator<ExampleComponent>;
  const createComponent = createComponentFactory({
    component: ExampleComponent,
    // It is possible to tell Spectator not to add the component to the declarations of the internal module and, instead, use the explicitly defined module as is. Simply set the declareComponent property of the factory options to false:
    imports: [ExampleModule],
    declareComponent: false
  });

  beforeEach(() => {
    spectator = createComponent({
      // The component inputs
      props: {
        name: 'example'
      },
      // Override the component's providers
      providers: [],
      // Whether to run change detection (defaults to true)
      detectChanges: false
    });
  });

  it('should have a success class by default', () => {
    spectator.detectChanges();

    // This test checks that the input attribute name becomes a class in the component structure
    expect(spectator.query('div')).toHaveClass('example');
  });
});
```

## Mock Ngrx state

The previous example with a fake ngrx state.

```ts
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ExampleComponent } from './example.component';
import { ExampleModule } from './example.module';

describe('ButtonComponent', () => {
  let spectator: Spectator<ExampleComponent>;
  let store: MockStore;
  const createComponent = createComponentFactory({
    component: ExampleComponent,
    // It is possible to tell Spectator not to add the component to the declarations of the internal module and, instead, use the explicitly defined module as is. Simply set the declareComponent property of the factory options to false:
    imports: [ExampleModule],
    declareComponent: false
  });
  // fake state
  const initialState = { loggedIn: false };

  beforeEach(() => {
    spectator = createComponent({
      // The component inputs
      props: {
        name: 'example'
      },
      // Override the component's providers
      providers: [
        provideMockStore({ initialState }),
      ],
      // Whether to run change detection (defaults to true)
      detectChanges: false
    });

    store = spectator.inject(MockStore);
  });

  it('should have a success class by default', () => {
    // change ngrx state
    store.setState({ loggedIn: true });

    spectator.detectChanges();

    // This test checks that the input attribute name becomes a class in the component structure
    expect(spectator.query('div')).toHaveClass('example');
  });
});
```

## Mock Ngrx selector

[Official docs](https://ngrx.io/guide/store/testing#using-mock-selectors)

```ts
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ExampleComponent } from './example.component';
import { ExampleModule } from './example.module';

// The selector to mock
import { selectUser } from './state/user.selectors';

describe('ButtonComponent', () => {
  let spectator: Spectator<ExampleComponent>;
  let store: MockStore;
  const createComponent = createComponentFactory({
    component: ExampleComponent,
    // It is possible to tell Spectator not to add the component to the declarations of the internal module and, instead, use the explicitly defined module as is. Simply set the declareComponent property of the factory options to false:
    imports: [ExampleModule],
    declareComponent: false,
    providers: [
      provideMockStore({ initialState }),
    ],
  });

  // fake state
  const initialState = { loggedIn: false };

  beforeEach(() => {
    spectator = createComponent({
      // The component inputs
      props: {
        name: 'example'
      },
      // Override the component's providers
      // Whether to run change detection (defaults to true)
      detectChanges: false
    });

    store = spectator.inject(MockStore);
  });

  it('should have a success class by default', () => {
    // change ngrx state
    store.setState({ loggedIn: true });

    // mock selector
    const mockUserSelector = store.overrideSelector(selectUser, {
      id: 1,
      name: 'test',
    });

    // trigger emission from all selectors
    store.refreshState();
    spectator.detectChanges();

    // This test checks that the input attribute name becomes a class in the component structure
    expect(spectator.query('div')).toHaveClass('example');
  });
});
```

## RxState

// Todo

## Mock Components, Directives, Pipes, Modules, Services and Tokens

We're using [ng-mock](https://ng-mocks.sudo.eu/) to easy mock Angular features. Check the documtation to know more.

Example:

```ts
import { createHostFactory } from '@ngneat/spectator';
import { MockComponent } from 'ng-mocks';
import { FooComponent } from './path/to/foo.component';

const createHost = createHostFactory({
  component: YourComponentToTest,
  declarations: [
    MockComponent(FooComponent)
  ]
});
```
