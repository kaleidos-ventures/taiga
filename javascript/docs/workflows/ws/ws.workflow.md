# Watch an specific websocket event

To watch for a specific ws event you have use the `events` method like in the following example. We're listening for an event with the name `update-task`.

```ts
import { WsService } from '@taiga/ws';

@Injectable()
export class TodoListEffects {
  public wsUpdateTask$ = createEffect(() => {
    return this.wsService.events<Task>('update-task').pipe(
      map((response) => {
        const task = response.event.content;
        return TodoListActions.changeTaskSuccess({
          taskId: task.id,
          completed: task.completed,
        });
      })
    );
  });

  constructor(private wsService: WsService) {}
}
```

In this example we're using the service in an `ngrx` effect but can be use in components if an event is not being launched.

# Watch an specific websocket action

```ts
import { WsService } from '@taiga/ws';

@Injectable()
export class TodoListEffects {
  public wsUpdateTask$ = createEffect(() => {
    return this.wsService.action('update-task').pipe(
      map(() => {
        return TodoListActions.changeTaskSuccess();
      })
    );
  });

  constructor(private wsService: WsService) {}
}
```

# Run command

```ts
this.wsService
  .command('test-command')
  .pipe(timeout(2000))
  .subscribe(
    (result) => {
      // Can be WSResponseActionSuccess or WSResponseActionError
      console.log(result);
    },
    () => {
      console.error('command timeout');
    }
  );
```
