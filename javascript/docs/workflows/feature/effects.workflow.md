## Effects

Check [ngrx](https://ngrx.io/guide/effects) for detailed documentation.

Also take a look of the [NX](https://nx.dev/latest/angular/guides/misc-data-persistence) for common helpers.

# Fetch data:

```ts
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { fetch } from '@nx/angular';

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
            message: 'errors.please_refresh',
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

You can override the default error for a status, for example if there is an error 500 it will show a toast instead of redirecting to the unexpected error page.

```ts
this.appService.errorManagement(httpResponse, {
  500: {
    type: 'toast',
    options: {
      label: 'errors.save_changes',
      message: 'errors.please_refresh',
      status: TuiNotification.Error,
    },
  },
});
```

To show the toast notification set in the onError:

```ts
this.appService.toastNotification({
  label: 'errors.text',
  mesage: 'errors.please_refresh',
  status: TuiNotification.Error,
});
```

# Testing server error

```ts
exampleApiService.callApi.mockReturnValue(
  cold(
    '-#|',
    {},
    {
      // HttpErrorResponse
      status: 400,
    }
  )
);

expect(effects.example$).toSatisfyOnFlush(() => {
  expect(buttonLoadingService.error).toHaveBeenCalled();
  expect(appService.errorManagement).toHaveBeenCalled();
});
```

# Send data

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

Sync your button status or the function `send` with the feature state. The state will store the status of the request and will be update with the "init" action and the "error/success" actions.

### Multi request

#### Sending data -> change state

If you want to update the state or make another action after the request you must use `pessimisticUpdate`. This will force the developer to provide a way to handle the error. Also it works like `concatMap`.

#### Sending data and change state at the same time

If you want to make the changes to the state before the server, use `optimisticUpdate`. This will force the developer to provide a way to undo the action if there is an error. Also it works like `concatMap`.

#### concatMap

The requests will be queued. For example for publishing a comment if you click twice the button, it will run the first request from the first click and the the second one, so maybe two equal comments are created. It can be useful to update something and with no lost updates and no race conditions.

#### switchMap

The current request will be cancelled if a new action come through. For example if you request an item `a` and an item `b` with the same action before the first request is complete, the `a` request will be cancelled.

### mergeMap

This will be run every request even is there are other actions in progress.
