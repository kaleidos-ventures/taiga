# D&D

# Usage

Add the module.

```ts
import { DragModule } from '~/app/shared/drag/drag.module';

@NgModule({
  imports: [
    DragModule
```

Define where is valid to drop an element. An ID is required to identify different drop zones.

```html
<div [tgDropZone]="id"></div>
```

Define draggable elements.

```html
<div
  [tgDraggable]="id"
  [dragData]="data"
  [dragDisabled]="isScrollDisabled()"></div>
```

The html that is going to follow the cursor on drag.

```html
<tg-drag-in-progress *ngIf="moving$ | async as movingElements">
  <div *ngFor="let element of movingElements; trackBy: trackBy">
    <tg-example-component [el]="element"></tg-example-component>
  </div>
</tg-drag-in-progress>
```

## Events

```ts
class Test {
  constructor(private dragService: DragService) {
    // drag start
    this.dragService.started().subscribe((data) => {
      // dragData @Input
      console.log(data);
    });

    // dropped
    this.dragService.dropped().subscribe((event) => {
      // event is DroppedEvent
      console.log(event);
    });

    // new over
    this.dragService.over().subscribe((event) => {
      // event is OverEvent
      console.log(event);
    });
  }
}
```

## Autoscroll

Scroll while you are dragging an element

```ts
class Test {
  @ViewChild(CdkVirtualScrollViewport)
  public cdkScrollable!: CdkVirtualScrollViewport;

  public listenAutoScroll() {
    this.autoScrollService
      .listen(this.cdkScrollable, 'horizontal', 300, 1)
      .pipe(untilDestroyed(this))
      .subscribe();
  }
}
```
