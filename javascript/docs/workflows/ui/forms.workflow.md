Taiga forms by default are typed reactive forms.

## Form example

```html
<form
  [formGroup]="form"
  (submit)="submit()"
  #exampleForm="ngForm">
  <tg-ui-input
    [icon]="iconSvg"
    [label]="label">
    <input
      formControlName="email"
      inputRef
      [placeholder]="placeholder" />
    <ng-container inputError>
      <tg-ui-error error="required"> Field mandatory </tg-ui-error>
      <tg-ui-error error="email"> Invalid email </tg-ui-error>
    </ng-container>
  </tg-ui-input>
  <tg-ui-select [label]="label">
    <tui-select
      tuiTextfieldSize="l"
      formControlName="example">
      <tui-data-list-wrapper
        *tuiDataList
        [items]="items"></tui-data-list-wrapper>
    </tui-select>
  </tg-ui-select>
  <tg-ui-textarea
    [label]="label"
    [optional]="true">
    <tui-text-area
      formControlName="description"
      [expandable]="true"
      [tuiTextfieldMaxLength]="140">
      Type it
    </tui-text-area>
    <tg-ui-error
      inputError
      error="maxlength">
      Maximun length 140
    </tg-ui-error>
  </tg-ui-textarea>
  <button type="submit">Submit</button>
</form>
```

With `{ updateOn: 'submit' }` the validation only happens on submit.

```ts
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      example: ['', [Validators.required]],
      description: ['', [Validators.maxLength(140)]],
    }, { updateOn: 'submit' });
  }
```

## Disable form errors

Globally

```html
<form [showFormErrors]="false"></form>
```

Individually

```html
<tg-ui-error
  error="email"
  [enabled]="false">
  Invalid email
</tg-ui-error>
```

## Selects with object value

```html
<tg-ui-select>
  <tui-select
    [ngModel]="dataModel"
    [ngModelOptions]="{ standalone: true }"
    [valueContent]="selectLabel">
    <tui-data-list *tuiDataList>
      <button
        *ngFor="
          let item of countries;
          trackBy: trackByKey
        "
        tuiOption
        [value]="item">
        {{ item.value }}
      </button>
    </tui-data-list>
  </tui-select>
</tg-ui-select>
<ng-template
  #selectLabel
  let-item
  >{{ item.value }}</ng-template
>
```

```ts
this.countries = [
  { key: 'pt', value: 'Portugal' },
  { key: 'fr', value: 'France' },
  { key: 'es', value: 'Spain' },
];

this.dataModel = {
  key: 'es',
  value: 'Spain',
};

// this is for accesibility, taiga ui set an string as a value, so if this is not setted the value available for screen readers will be [Object Object]
this.dataModel.toString = function () {
  return this.value;
};
```

## Reactive forms

Reactive forms are Angular model driven forms. It handles in the component model changes on the form template.
Reactive forma are widely explained in [Angular documentation](https://angular.io/guide/reactive-forms)

## Send data

### Prevent submit multiple

#### Using button loading directive

If you are using a `button[submit]` inside a `form` you can use [button loader](/javascript/docs/workflows/ui/loaders.workflow.md). The `loading` will disable the button and therefore the form.

#### Using exhaustMap

`exhaustMap` will prevent any other request to continue if one is already one in progress.

```ts
public effect$ = createEffect(() => {
  return this.actions$.pipe(
    ofType(AllActions.action),
    exhaustMap() => {
      return this.theService.requestExample();
    })
  );
});
```

#### Feature state

Sync your button status or the function send with the feature state. The state will store the status of the request and will be update with the "init" action and the "error/success" actions.

### Multi request

#### Sending data -> change state

If you want to update the state or make another action after the request you must use `pessimisticUpdate`. Check `/javascript/docs/workflows/feature/effects.workflow.md`. This will force the developer to provide a way to handle the error. Also it works like `concatMap`.

#### Sending data and change state at the same time

If you want to make the changes to the state before the server, use `optimisticUpdate`. Check `/javascript/docs/workflows/feature/effects.workflow.md`. This will force the developer to provide a way to undo the action if there is an error. Also it works like `concatMap`.

#### concatMap

The requests will be queued. For example for publishing a comment if you click twice the button, it will run the first request from the first click and the the second one, so maybe two equal comments are created. It can be useful to update something and with no lost updates and no race conditions.

#### switchMap

The current request will be cancelled if a new action come through. For example if you request an item `a` and an item `b` with the same action before the first request is complete, the `a` request will be cancelled.

### mergeMap

This will be run every request even is there are other actions in progress.
