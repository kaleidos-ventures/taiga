# Create a new shortcut

Taiga uses [hotkeys](https://www.npmjs.com/package/hotkeys-js) for the shortcuts, check it out for more info.

1. Add the shortcut to `/javascript/libs/core/src/lib/services/shortcuts/shortcuts.ts`

```ts
{
  task: 'task.name',
  defaultKey: 'esc',
  scope: 'excecutionScope'
}
```

`task`: Your task name, must be unique and describe the action.

`defaultKey`: the key that will run the task.

`scope` (optional): If you define a scope this task will be only available when this scope is set.

2. Define & subscribe to the shortcut, you can also use it in an effect.

```ts
import { ShortcutsService } from '@taiga/core';

class Test {
  constructor(private shortcutsService: ShortcutsService) {
    const subscription = this.shortcutsService
      .task('task.name')
      .subscribe(() => {
        // task
      });
  }
}
```

3. Set the scope, if it's needed. Remember if a task has a scope it'll only work when you set the same scope. Warning, avoid using scope if you can, the scope is only needed if you have two componentes at same time with the same shortcut, try using different shortcuts for different actions.

```ts
this.shortcutsService.setScope('excecutionScope');

// return to the main scope
this.shortcutsService.resetScope();

// return to the previous scope
this.shortcutsService.undoLastScope();

// remove scope and go to the previous one
this.shortcutsService.undoScope('scope');
```

In this example we listen `tooltip.close` when Tooltip is instanced but we only want to listen this task when the tooltip is open so we're responsible to activate the scope and disable it when not needed.

```ts
{
  task: 'tooltip.close',
  defaultKey: 'esc',
  scope: 'tooltip'
}
```

```ts
class Tooltip {
  constructor() {
    this.shortcutsService.task('tooltip.close').subscribe(() => {
      // close tooltip
    });
  }

  public open() {
    this.shortcutsService.setScope('tooltip');
  }

  public close() {
    this.shortcutsService.resetScope();
  }
}
```

4. Don't forget unsubscribe when it's needed

Option 1

```ts
import { ShortcutsService } from '@taiga/core';

class Test {
  constructor(private shortcutsService: ShortcutsService) {
    const subscription = this.shortcutsService
      .task('task.name')
      .subscribe(() => {
        // task
      });

    subscription.unsubscribe();
  }
}
```

Option 2

```ts
import { ShortcutsService } from '@taiga/core';

class Test {
  ngUnsubscribe = new Subject();

  constructor(private shortcutsService: ShortcutsService) {
    this.shortcutsService
      .task('task.name')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        // task
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
```
