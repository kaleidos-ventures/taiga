
## Component or feature?
This document goal is to create a simple component. If you are willing to create a full feature including module, state, tests, etc. you might want to consider switching to `feature/feature.workflow.md` file.

## Component organization
Depending on the type of component there could be three different locations where you could save the component:

* **Specific components**: Are only used in one page. Save it in under `/apps/taiga/src/app/features/${featureName}/${componentName}`
* **Common components**: Are used in multiple pages but are not part of the Design System. Save it in under `/apps/taiga/src/app/shared/${componentName}`
* **Design System**: Will be used in multiple components and pages. Save it in under the ui library `/libs/ui/src/lib/${componentName}`

# Creating a new component

Create an `Example` component for a feature in the shared/ folder (or any other feature folder).

```bash
// shared component
npx schematics ./schematics:create-component --name example --dryRun=false

// feature component
npx schematics ./schematics:create-component --name list --module todo-list.module --path apps/taiga/src/app/features/todo-list/components --dryRun=false

// disable localState or globalState
npx schematics ./schematics:create-component --name example --dryRun=false --localState false --globalState false
```

This will generate the component files (html, css, ts, spec) and will add the component to the parent module declarations and exports.

Set the component name and selector using the `tg` prefix and remove the unused OnInit function

```ts
@Component({
  selector: 'tg-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {

  constructor() { }

}
```

Where possible, we should try to maintain the same element interface as the standard HTML elements. Let's say we create a tgButton, we can expect it to implement a class, type, disabled or aria-label attributes plus any other required Inputs, such as the variant.

As a reminder

- `@Attribute` will read an attribute from the host tag and bind it to a component variable once, on the constructor. This is useful for binding attributes that won't change.
- `@Hostbinding` is the same as @Attribute, but the binding will be listened for changes in the host and updated in the component.

Implement the `:host` selector in the CSS to set the styles of the host container.

Use the `ChangeDetectionStrategy.OnPush` by default meaning that automatic change detection is deactivated. Change detection can still be explicitly invoked.

## Local state

For a reactive local state we use [rx-angular](https://github.com/rx-angular/rx-angular/blob/master/libs/state/docs/usage.md). It's recommended to read the documentation, following some usage examples.

```ts
@Component({
   selector: 'tg-todo-page',
   template: `
   <ul>
      <li *ngFor="let task of tasks$ | push">
        {{ task.name }} <button (click)="deleteBtn$.next(task.id)">remove<button>
      </li>
    </ul>
   `,
   providers: [RxState]
})
export class TodoPageComponent implements OnInit {
  public readonly tasks$ = this.state.select('tasks');
  public readonly deleteBtn$ = new Subject();
  public readonly model$ = this.state.select();

  constructor(
    private store: Store,
    // local state
    private state: RxState<{
      loading: boolean,
      tasks: Task[],
    }>,
  ) {
    this.state.set({
      loading: false,
      tasks: [],
    });
  }

  public ngOnInit(): void {
    this.store.dispatch(TodoListActions.init());

    // delete task whent the button is pressed
    this.state.connect(
      this.deleteBtn$, (state, id) => {
        return {
          ...state,
          tasks: state.tasks.filter(i => i.id !== id)
        }
    );

    // connect the ngrx state with the local state
    this.state.connect('tasks', this.store.select(seletTasks));
  }

  public initLoading() {
    // change the local state
    this.state.set({
      loading: true,
    });
  }
}
```

```html
<ng-container *ngIf="model$ | async as vm">
  <p>{{ vm.loading }}</p>
</ng-container>
```

### Translation

Maybe the component could benefict from lazy load translations, check "Lazy load translation files" in translation.workflow.

## Responsive

For styling purposes you will find media queries under the styles folder, `responsive.css` file.
When responsive affects Behaviour, we will use the [Layout CDK helper](https://material.angular.io/cdk/layout/overview)

```ts
import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';

@Component({
  selector: 'tg-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css'],
})
export class ExampleComponent implements OnInit {
  constructor(
    public breakpointObserver: BreakpointObserver,
    ) {}

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait])
      .subscribe((state: BreakpointState) => {
        if (result.matches) {
          this.doThingsForHadsetPortrait();
        }
      });
  }
}
```

For specific media queries (avoid if not specifically required by design) you can use [`MediaMatcher`](https://material.angular.io/cdk/layout/overview#mediamatcher)

## Accesibility

Please review our accessibility statement here: https://drive.google.com/drive/folders/1H63BloH6ReR4FABHrFWRRoEkgPfn0632?usp=sharing

## Testing

Don't forget your component tests! Please follow the documentation at `testing/component-testing.workflow.md` and if applies to `testing/e2e.workflow.md`
