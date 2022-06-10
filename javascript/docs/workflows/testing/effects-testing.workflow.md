# Ngrx effects testing workflow

Before start you should read [the ngrx effects testings docs](https://ngrx.io/guide/effects/testing), [Testing RxJS Code with Marble Diagrams](https://rxjs.dev/guide/testing/marble-testing) and the [jest-marbles docs](https://github.com/just-jeb/jest-marbles) that we use and wraps RxJS TestScheduler.

## Example

This example receives an user login info in the actions props and send it to the service method AuthApiService/login and if it's successful call to the loginSuccess action with the response.

```ts
let actions$: Observable<Action>;
let spectator: SpectatorService<LoginEffects>;
const createService = createServiceFactory({
  service: LoginEffects,
  providers: [provideMockActions(() => actions$)],
  mocks: [AuthApiService],
});

beforeEach(() => {
  spectator = createService();
});

it('login success', () => {
  const loginData = {
    username: 'myusername',
    password: '1234',
  };
  const response = { success: true };
  const authApiService = spectator.inject(AuthApiService);
  const effects = spectator.inject(LoginEffects);

  // mock the service response
  authApiService.login.mockReturnValue(cold('-b|', { b: response }));

  // send action
  actions$ = hot('-a', { a: login({ data: loginData }) });

  // response wait two(-) and get the loginSuccess action response
  const expected = cold('--a', {
    a: loginSuccess({ data: response }),
  });

  expect(effects.login$).toBeObservable(expected);
});
```

### Non-dispatching effect

```ts
it('non-dispatching', () => {
  const localStorageService = spectator.inject(LocalStorageService);
  const response = { success: true };
  const effects = spectator.inject(LoginEffects);

  actions$ = hot('-a', { a: loginSuccess({ data: response }) });

  // subscribing because there is no expect
  effects.loginSuccess$.subscribe();

  // flush to complete all outstanding hot or cold observables
  m.flush();

  expect(localStorageService.set).toHaveBeenCalled();
});
```

### Errors

```ts
it('testing error', () => {
  randomApiService.methonName.mockReturnValue(
    cold(
      '-#|',
      {},
      {
        status: 400,
      }
    )
  );

  const expected = cold('-a', {
    a: actionTestError({ status: 400 }),
  });

  actions$ = hot('-a', { a: actionTest({ token, password }) });

  expect(effects.test$).toBeObservable(expected);
  expect(effects.test$).toSatisfyOnFlush(() => {
    expect(buttonLoadingService.error).toHaveBeenCalled();
  });
});
```

### Time progression

For testing an observable with timing like `500ms a` testScheduler is needed until `jest-marbles` support  time progression https://github.com/just-jeb/jest-marbles/issues/117.

```ts
it('Test example', () => {
  const effects = spectator.inject(ExampleEffects);
  const exampleApiService = spectator.inject(ExampleApiService);

  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

  testScheduler.run((helpers) => {
    const { expectObservable, cold, hot } = helpers;

    exampleApiService.test.mockReturnValue(
      cold('-b|', { b: { success: true } })
    );

    actions$ = hot('-a', {
      a: actionExample({ searchUser: { text: searchText } }),
    });

    expectObservable(effects.searchUser$).toBe('500ms a', {
      a: actionExampleSuccess({ success: true }),
    });
  });
});
```
