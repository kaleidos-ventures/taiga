# Create feature

A feature is one or more group of componentes and service that can have a state (ngrx). 
If you are looking for the worflow on how to create a simple component, follow the `feature/component.workflow.md` file.

## Common feature

```bash
npx ng g @schematics/angular:module --name=TodoList --project=taiga --module=commons.module --path=apps/taiga/src/app/commons
```

Open `/apps/taiga/src/app/commons/commons.module.ts` and add the new module to `exports`.

## Page

If the component is the page root we have to add it to pages.module.

```bash
npx ng g @schematics/angular:module --name=TodoList --project=taiga --module=pages.module --path=apps/taiga/src/app/pages --route=todos
```

This will create/update the following files.

```bash
CREATE apps/taiga/src/app/pages/todo-list/todo-list.module.ts
CREATE apps/taiga/src/app/pages/todo-list/todo-list.component.css
CREATE apps/taiga/src/app/pages/todo-list/todo-list.component.html
CREATE apps/taiga/src/app/pages/todo-list/todo-list.component.spec.ts
CREATE apps/taiga/src/app/pages/todo-list/todo-list.component.ts
UPDATE apps/taiga/src/app/pages/pages.module.ts
```

### Add an state

```bash
npx ng g @ngrx/schematics:feature TodoList --module=todo-list.module.ts --project=taiga --path=apps/taiga/src/app/pages/todo-list --group --no-interactive
```

This will create/update the following files.

```bash
CREATE apps/taiga/src/app/pages/todo-list/actions/todo-list.actions.spec.ts
CREATE apps/taiga/src/app/pages/todo-list/actions/todo-list.actions.ts
CREATE apps/taiga/src/app/pages/todo-list/reducers/todo-list.reducer.spec.ts
CREATE apps/taiga/src/app/pages/todo-list/reducers/todo-list.reducer.ts
CREATE apps/taiga/src/app/pages/todo-list/effects/todo-list.effects.spec.ts
CREATE apps/taiga/src/app/pages/todo-list/effects/todo-list.effects.ts
CREATE apps/taiga/src/app/pages/todo-list/selectors/todo-list.selectors.spec.ts
CREATE apps/taiga/src/app/pages/todo-list/selectors/todo-list.selectors.ts
UPDATE apps/taiga/src/app/pages/todo-list/todo-list.module.ts
```

Ngrx schematics right now doesn't use the new `createFeature` so we have to manually update the files. Here an example of a valid ngrx state.

We use [immer](https://github.com/immerjs/immer) to mutate the state with the helper function  immerReducer

```ts
import { immerReducer } from '@/app/commons/utils/store';
import { createFeature, createReducer, on } from '@ngrx/store';

// todo-list.reducer.ts
interface TodosState {
  todos: Todo[];
  filter: string;
}

const initialState: TodosState = {
  todos: [],
  filter: '',
};

const reducer = createReducer(
  initialState,
  on(TodoListActions.loadSuccess, (state, { todos }): TodosState => {
    state.todos = todos;

    return state;
  }),
);

export const todosFeature = createFeature({
  name: 'todos',
  reducer: immerReducer(reducer),
});

// todo-list.selectors.ts
import { todosFeature } from './todo-list.reducer';

export const {
  selectTodos,
  selectFilter,
} = todosFeature;

export const selectFilteredTodos = createSelector(
  selectTodos,
  // ...
);

// todo-list.module.ts
import { todosFeature } from './todo-list.reducer';

StoreModule.forFeature(todosFeature);
```

### Creating models

Add your models in `apps/taiga/src/app/pages/todo-list/models/`.

Example:

```ts
export interface Todo {
  id: string;
  title: string;
}
```

Is the new model is used in other modules add it to `libs/data/src/lib/`.

### Create a feature submodule

If your feature complex enough rememember to create new modules inside the feature.

For example: 

```bash
npx ng g @schematics/angular:module --name=TodoListConfig --project=taiga --module=todo-list.module --path=apps/taiga/src/app/pages/todo-list --route=config
```

This will create/update the following files.

```bash
CREATE apps/taiga/src/app/pages/todo-list/todo-list-config/todo-list-config.module.ts
CREATE apps/taiga/src/app/pages/todo-list/todo-list-config/todo-list-config.component.css
CREATE apps/taiga/src/app/pages/todo-list/todo-list-config/todo-list-config.component.html
CREATE apps/taiga/src/app/pages/todo-list/todo-list-config/todo-list-config.component.spec.ts
CREATE apps/taiga/src/app/pages/todo-list/todo-list-config/todo-list-config.component.ts
UPDATE apps/taiga/src/app/pages/todo-list/todo-list.module.ts
```

### Testing selectors

https://ngrx.io/guide/store/testing#testing-selectors

### Testing reducers

https://ngrx.io/guide/store/testing#testing-reducers

### Translation

It's recommended to lazy load the module translation check "Lazy load translation files" in translation.workflow
