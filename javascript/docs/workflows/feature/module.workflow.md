# Create Module

A module is one or more group of componentes and service that can have a state (ngrx).
If you are looking for the worflow on how to create a simple component, follow the `feature/component.workflow.md` file.

## Create module

We have two main types of modules, data-access & features.

`data-access` has an ngrx state are used from feature to get data.

`features` are taiga pages or big feature rich components. A feature usually contains most of the ui components and interact with the ngrx.

Check `folder-structure.md` to see how these folders look.

Using cli to create a feature without state:

```
npx nx g ./schematics:create-module --name ProjectsFeatureList --module app-routing.module --path apps/taiga/src/app/modules/projects/feature-list --routing --route projects/list --dry-run false --no-interactive
```

Using cli to create a data-access with state:

```
npx nx g ./schematics:create-module --name ProjectsDataAccess --path apps/taiga/src/app/modules/projects/data-access --stateFilesName list --globalState --dry-run false --no-interactive
```

## Configure lazy load translation

[Follow this guide](https://ngneat.github.io/transloco/docs/scope-configuration) to split the tranlation into multiples files to help the initial load.

### State

We use [immer](https://github.com/immerjs/immer) to mutate the state with the helper function createImmerReducer. Here is an example of a full feature state ngrx.

```ts
import { createImmerReducer } from '~/app/shared/utils/store';
import { createFeature, on } from '@ngrx/store';

// todo-list.reducer.ts
interface TodosState {
  todos: Todo[];
  filter: string;
}

const initialState: TodosState = {
  todos: [],
  filter: '',
};

const reducer = createImmerReducer(
  initialState,
  on(TodoListActions.loadSuccess, (state, { todos }): TodosState => {
    state.todos = todos;

    return state;
  })
);

export const todosFeature = createFeature({
  name: 'todos',
  reducer: reducer,
});

// todo-list.selectors.ts
import { todosFeature } from './todo-list.reducer';

export const { selectTodos, selectFilter } = todosFeature;

export const selectFilteredTodos = createSelector(
  selectTodos
  // ...
);

// todo-list.module.ts
import { todosFeature } from './todo-list.reducer';

StoreModule.forFeature(todosFeature);
```

### Creating models

Add your models in `apps/taiga/src/app/features/todo-list/models/`.

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
