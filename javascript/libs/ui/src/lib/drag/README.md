# D&D

# Usage

Add to the component

```ts
import { DropZoneDirective } from '@taiga/ui/drag/directives/drop-zone.directive';
import { DraggableDirective } from '@taiga/ui/drag/directives/draggable.directive';
import { DragInProgressComponent } from '@taiga/ui/drag/components/drag-in-progress.component';

@Component({
  imports: [
    DropZoneDirective,
    DraggableDirective,
    DragInProgressComponent
  ]
})
```

Define where is valid to drop an element. An ID is required to identify different drop zones.

```html
<div [tgUiDropZone]="id"></div>
```

Define draggable elements.

```html
<div
  [tgUiDraggable]="id"
  [dragData]="data"
  [dragDisabled]="isScrollDisabled()"></div>
```

The html that is going to follow the cursor on drag.

```html
<tg-ui-drag-in-progress *ngIf="moving$ | async as movingElements">
  <div *ngFor="let element of movingElements; trackBy: trackBy">
    <tg-example-component [el]="element"></tg-example-component>
  </div>
</tg-ui-drag-in-progress>
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

## Drop category

You can define different drop categories so multiples drags & drops don't interfer with each other.

```html
<div
  [tgUiDropZone]="id"
  [dropCategory]="category-1"></div>

<div
  [tgUiDraggable]="id"
  [dropCategory]="category-1"></div>
```

## Drag Handle

You can select which part of the draggable element can be used to initiate the drag and drop.

```html
<div
  [tgUiDraggable]="id"></div>

  <div tgUiDragHandle>Init drag</div>
</div>
```
