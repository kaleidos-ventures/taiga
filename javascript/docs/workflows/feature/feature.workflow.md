# Create feature

A feature is one or more group of componentes and service that can have a state (ngrx).
If you are looking for the worflow on how to create a simple component, follow the `feature/component.workflow.md` file.

## Create feature

```bash
npx schematics ./schematics:create-feature --name todoList --no-interactive  --dryRun=false
```

## Page

If the component is the page root we have to add it to pages.module.

```bash
npx ng g @schematics/angular:module --name=Login --module=app-routing.module --path=apps/taiga/src/app/pages --route=login
```

### State

We use [immer](https://github.com/immerjs/immer) to mutate the state with the helper function immerReducer. Here is an example of a full feature state ngrx.

```ts
import { immerReducer } from '~/app/shared/utils/store';
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

### Testing selectors

https://ngrx.io/guide/store/testing#testing-selectors

### Testing reducers

https://ngrx.io/guide/store/testing#testing-reducers

### Translation

It's recommended to lazy load the module translation check "Lazy load translation files" in translation.workflow
