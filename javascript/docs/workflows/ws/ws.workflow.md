# Watch an specific websocket event

To watch for a specific ws event you have use the `events` method like in the following example. We're listening for an event with the name `update-task`.

```ts
import { WsService } from '~/app/services/ws';

@Injectable()
export class TodoListEffects {
  public wsUpdateTask$ = createEffect(() => {
    return this.wsService
      .events<Task>({ type: 'update-task', channel: 'user' })
      .pipe(
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
import { WsService } from '~/app/services/ws';

@Injectable()
export class TodoListEffects {
  public wsUpdateTask$ = createEffect(() => {
    return this.wsService.action({ command: 'signin', channel: 'users' }).pipe(
      map(() => {
        return AuthActions.eventsSingninSuccess();
      })
    );
  });

  constructor(private wsService: WsService) {}
}
```

# Run command

```ts
this.wsService
  .command('signin', { token: '1234' })
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
