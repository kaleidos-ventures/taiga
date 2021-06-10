# Watch an specific websocket event

To watch for a specific ws event you have use the `events` method like in the following example. We're listening for an event with the name `update-task`.

```ts

import { WsService } from '@taiga/ws';

@Injectable()
export class TodoListEffects {
  public wsUpdateTask$ = createEffect(() => {
    return this.wsService.events<{ task: Task }>('update-task').pipe(
      map(({ task }) => {
        return TodoListActions.changeTaskSuccess({ taskId: task.id, completed: task.completed });
      })
    );
  });

  constructor(private wsService: WsService) {}
}
```

In this example we're using the service in an `ngrx` effect but can be use in components if an event is not being launched.
