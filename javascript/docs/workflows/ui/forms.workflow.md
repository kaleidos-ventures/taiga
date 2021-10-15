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
      <button type="submit">Submit</button>
    </form>
```

With `{ updateOn: 'submit' }` the validation only happens on submit.

```ts
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    }, { updateOn: 'submit' });
  }
```

## Reactive forms

Reactive forms are Angular model driven forms. It handles in the component model changes on the form template.
Reactive forma are widely explained in [Angular documentation](https://angular.io/guide/reactive-forms)

## Typing forms

By default, Angular reactive forms are not typed. We decided that is a good practice to type this forms as we do with similar non-form objects.
To accomplish it, we [use the library ngneat/reactive-forms](https://github.com/ngneat/reactive-forms)

