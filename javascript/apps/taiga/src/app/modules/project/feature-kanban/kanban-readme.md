# Kanban

## Kanban Virtual Scroll

Kanban tasks are only rendered if they are in the viewport. For that we are using https://material.angular.io/cdk/scrolling/overview.

We have two scrolls, the horizontal for the kanban status and the vertical tasks scrolls.

Angular cdk scroll doesn't work with dynamic height items, so we have our own scroll strategy `KanbanVirtualScrollStrategy`.

`KanbanVirtualScrollStrategy` receives `itemHeights` an array of heights to calculate the scroll size. `KanbanVirtualScrollStrategy` is going to use these heights until the real task is rendered, then is going to use the real one. `checkRenderedContentSize` is responsible for this calculation, the function run when the content changed.

The attribute `kanbanVirtualScrollStrategy` in `cdk-virtual-scroll-viewport` make this works.

Most of the `KanbanVirtualScrollStrategy` code is based in other `VirtualScrollStrategy`.

[Issue](https://github.com/angular/components/issues/10113). Angular have an experimental support for dynamic heights. We probably must use it when it's stable.

## Kanban keyboard navigation

`KanbanWorkflowKeyboardNavigationDirective` capture arrow left/right keyboard events no navigate horizontally between statuses. Because we use virtual scroll the status is not always visible so is going to wait until is render to move the focus & scroll.

We also capture keyboard arrows to move between tasks. When the user navigate between task in different statuses, we make a live announce with the new status title.

## Horizontal scroll with drag & drop

`KanbanWorkflowComponent` use `KineticScrollService` for scrolling with momentum.

## Status column height

Angular cdk scroll needs a fixed height for the scroll, but we need a dynamic height because the `add task` button.

`StatusScrollDynamicHeightDirective` is going to observe the content and for every html change is going to calculate the new height without exceeding the maximum height available.

## Scroll to the new task

When a new task is created, it is stored in the global state. `KanbanStatusComponent` is watching for new tasks in a status using `selectStatusNewTasks(this.status.slug)` and every time a new task is created the component run `scrollToTask`. The function `scrollToTask` is not easy because we don't render all the tasks so the component scroll to bottom and then wait for 500ms for changes in the scrollStrategy height if there is any change then run again scroll bottom.
