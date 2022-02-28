## Effects

Check [ngrx](https://ngrx.io/guide/effects) for detailed documentation.

Also take a look of the [NX](https://nx.dev/latest/angular/guides/misc-data-persistence) for common helpers.

# Fetch data:

```ts
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { fetch } from '@nrwl/angular';

@Injectable({
  providedIn: 'root',
})
class TodoEffects {
  public loadTodos$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TodoListActions.loadTodos),
      fetch({
        run: () => {
          return this.todoListService
            .getAll()
            .pipe(map((tasks) => TodoListActions.loadTodosSucess({ tasks })));
        },
        onError: (action, error: HttpErrorResponse) =>
          this.appService.errorManagement(error),
      })
    );
  });

  constructor(
    private actions$: Actions,
    private todoListService: TodoListService
  ) {}
}
```

# Optimistic update:

For a better user experience, the optimisticUpdate operator updates the state on the client application first, before updating the data on the server-side. So for this example we will have a reducer `deleteTask` that will change the state and at the same time the effect will run and everything should be fine but if something unexpected goes wrong we will run undoAction.

So we use optimisticUpdate by default, when there are no expected errors.

```ts
@Injectable({
  providedIn: 'root',
})
class TodoEffects {
  public delete$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TodoListActions.deleteTask),
      optimisticUpdate({
        run: (action: ReturnType<typeof TodoListActions.deleteTask>) => {
          return this.todoListService
            .deleteTask(action.task.id)
            .pipe(
              mapTo(
                TodoListActions.deleteTaskSuccess({ taskId: action.task.id })
              )
            );
        },
        undoAction: (action, error: HttpErrorResponse) => {
          return TodoListActions.deleteTaskError({
            task: action.task,
            error: this.appService.formatHttpErrorResponse(error),
          });
        },
      })
    );
  });

  constructor(
    private actions$: Actions,
    private todoListService: TodoListService
  ) {}
}
```

# Pessimistic update:

With a pessimistic the effect updates the server data first, when the change is completed then we dispatch an action that changes the app.state

```ts
import { unexpectedError } from '@taiga/core';

@Injectable({
  providedIn: 'root',
})
class TodoEffects {
  public create$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TodoListActions.createTask),
      pessimisticUpdate({
        run: (action: ReturnType<typeof TodoListActions.createTask>) => {
          return this.todoListService
            .create(action.taskName)
            .pipe(map((task) => TodoListActions.createTaskSuccess({ task })));
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          const error = httpResponse.error as { msg?: string };

          if (error.msg) {
            return TodoListActions.createTaskError({ error: error.msg });
          }

          return this.appService.toastNotification({
            label: 'errors.text',
            mesage: 'errors.please_refresh',
            status: TuiNotification.Error,
          });
        },
      })
    );
  });

  constructor(
    private actions$: Actions,
    private todoListService: TodoListService
  ) {}
}
```

# Server errors

We have two types of errors. One will redirect to the 500 error page and the other will show a toast notification. Use the one that best suits you.

To redirect to 500 error page set in the onError:

```ts
this.appService.errorManagement(httpResponse);
```

To show the toast notification set in the onError:

```ts
this.appService.toastNotification({
  label: 'errors.text',
  mesage: 'errors.please_refresh',
  status: TuiNotification.Error,
});
```
