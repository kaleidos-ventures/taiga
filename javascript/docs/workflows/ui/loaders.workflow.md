# Loaders

Add the `ButtonLoadingModule` to your module. `import { ButtonLoadingModule } from '~/app/shared/directives/button-loading/button-loading.module';`.

Html example

```html
<button
  loading
  [loadingMsg]="t('login.in_progress')"
  [loadingSuccess]="t('login.success')"
  tuiButton
  appearance="primary"
  type="submit">
  {{ t('login.login') }}
</button>
```

Effects example

```ts
public effect$ = createEffect(() => {
  return this.actions$.pipe(
    ofType(AllActions.action),
    exhaustMap() => {
      this.buttonLoadingService.start();

      return this.theService
        .requestExample()
        .pipe(
          switchMap(this.buttonLoadingService.waitLoading()),
          map((auth: Auth) => {
            return AllActions.actionSuccess();
          }),
          catchError((httpResponse: HttpErrorResponse) => {
            this.buttonLoadingService.error();

            return of(AllActions.errorAction());
          })
        );
    })
  );
});
```

`this.buttonLoadingService.start();` will start the loading state after 2 seconds
`this.buttonLoadingService.whenReady()` ask the loading to stop, this will go to the finished state and after 5 seconds to the original state. But if the button is in the loading state, this method will wait until at least 2 seconds have passed because is the minimun duration of the animation.
`this.buttonLoadingService.error();` this will return the button to the original state.
