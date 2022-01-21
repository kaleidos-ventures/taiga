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
          [placeholder]="placeholder">
        <ng-container inputError>
          <tg-ui-error error="required">
            Field mandatory
          </tg-ui-error>
          <tg-ui-error error="email">
            Invalid email
          </tg-ui-error>
        </ng-container>
      </tg-ui-input>
      <tg-ui-select [label]="label">
        <tui-select
          tuiTextfieldSize="l"
          formControlName="example">
          <tui-data-list-wrapper
            *tuiDataList
            [items]="items"
          ></tui-data-list-wrapper>
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
  <form [showFormErrors]="false">

  </form>
```

Individually

```html
  <tg-ui-error
    error="email"
    [enabled]="false">
    Invalid email
  </tg-ui-error>
```

## Reactive forms

Reactive forms are Angular model driven forms. It handles in the component model changes on the form template.
Reactive forma are widely explained in [Angular documentation](https://angular.io/guide/reactive-forms)
