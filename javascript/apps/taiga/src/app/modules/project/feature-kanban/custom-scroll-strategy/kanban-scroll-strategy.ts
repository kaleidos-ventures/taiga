/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ListRange } from '@angular/cdk/collections';
import {
  CdkVirtualScrollViewport,
  ExtendedScrollToOptions,
  VirtualScrollStrategy,
  VIRTUAL_SCROLL_STRATEGY,
} from '@angular/cdk/scrolling';
import {
  ChangeDetectorRef,
  Directive,
  forwardRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

type ItemHeight = number[];

type Range = [number, number];

const intersects = (a: Range, b: Range): boolean =>
  (a[0] <= b[0] && b[0] <= a[1]) ||
  (a[0] <= b[1] && b[1] <= a[1]) ||
  (b[0] < a[0] && a[1] < b[1]);

const clamp = (min: number, value: number, max: number): number =>
  Math.min(Math.max(min, value), max);

const isEqual = <T>(a: T, b: T) => a === b;

const last = <T>(value: T[]): T => value[value.length - 1];

export class KanbanVirtualScrollStrategy implements VirtualScrollStrategy {
  constructor(private defaultItemHeights: ItemHeight) {}
  public contentChanged$ = new Subject<void>();
  public updatedItemHeights$ = new Subject<void>();
  public afterViewCheck$ = new Subject<void>();
  public scrolledIndexChange$ = new Subject<number>();
  public scrolledIndexChange: Observable<number> =
    this.scrolledIndexChange$.pipe(distinctUntilChanged());

  public viewport?: CdkVirtualScrollViewport;
  private itemHeights: ItemHeight = [];
  public attach(viewport: CdkVirtualScrollViewport) {
    this.viewport = viewport;
    this.updateTotalContentSize();
    this.updateRenderedRange();
    this.contentChanged$.pipe(debounceTime(100)).subscribe(() => {
      this.checkRenderedContentSize();
      this.afterViewCheck$.next();
    });
  }
  public detach() {
    this.scrolledIndexChange$.complete();
    this.contentChanged$.complete();
    delete this.viewport;
  }

  public getElementMargins(el: HTMLElement) {
    const start = Number(
      getComputedStyle(el).marginBlockStart.replace('px', '')
    );
    const end = Number(getComputedStyle(el).marginBlockEnd.replace('px', ''));

    return start + end;
  }

  public scrollTo(options: ExtendedScrollToOptions) {
    this.viewport?.scrollTo(options);
  }

  // replace the estimate itemHeights by the rendered story height
  public checkRenderedContentSize() {
    if (this.viewport) {
      let dirty = false;

      if (this.itemHeights.length !== this.defaultItemHeights.length) {
        dirty = true;

        // items were removed
        if (this.defaultItemHeights.length < this.itemHeights.length) {
          this.itemHeights = this.itemHeights.slice(
            0,
            this.defaultItemHeights.length
          );
        } else {
          // item added
          const newHeights = this.defaultItemHeights.slice(
            this.itemHeights.length,
            this.defaultItemHeights.length
          );

          this.itemHeights = this.itemHeights.concat(newHeights);
        }
      }

      const range = this.viewport.getRenderedRange();

      const storiesHeight = Array.from(
        this.viewport.elementRef.nativeElement.querySelectorAll<HTMLElement>(
          'tg-kanban-story'
        )
      ).map((story) => {
        return (
          story.getBoundingClientRect().height + this.getElementMargins(story)
        );
      });

      const itemHeights = this.itemHeights.map((height, index) => {
        if (index >= range.start && index < range.end) {
          const renderHeight = storiesHeight[index - range.start];

          if (renderHeight && height !== renderHeight) {
            dirty = true;
          }

          if (renderHeight) {
            return renderHeight;
          }
        }

        return height;
      });

      if (dirty) {
        this.itemHeights = itemHeights;
        this.updateItemHeights(itemHeights);
      }
    }
  }

  public updateItemHeights(itemHeights: ItemHeight) {
    this.defaultItemHeights = itemHeights;
    this.updateTotalContentSize();
    this.updateRenderedRange();
    this.updatedItemHeights$.next();
  }

  public onContentScrolled() {
    this.updateRenderedRange();
  }

  public onDataLengthChanged() {
    this.checkRenderedContentSize();
  }

  // calculate the real size of the rendered content
  public onContentRendered() {
    this.contentChanged$.next();
  }

  public onRenderedOffsetChanged() {
    //
  }
  public scrollToIndex(index: number, behavior: ScrollBehavior) {
    this.viewport?.scrollToOffset(this.getItemOffset(index), behavior);
  }
  private getItemOffset(index: number): number {
    return this.itemHeights
      .slice(0, index)
      .reduce((acc, itemHeight) => acc + itemHeight, 0);
  }
  private getTotalContentSize(): number {
    return this.itemHeights.reduce((a, b) => a + b, 0);
  }
  private getListRangeAt(
    scrollOffset: number,
    viewportSize: number
  ): ListRange {
    type Acc = { itemIndexesInRange: number[]; currentOffset: number };
    const visibleOffsetRange: Range = [
      scrollOffset,
      scrollOffset + viewportSize,
    ];
    const itemsInRange = this.itemHeights.reduce<Acc>(
      (acc, itemHeight, index) => {
        const itemOffsetRange: Range = [
          acc.currentOffset,
          acc.currentOffset + itemHeight,
        ];
        return {
          currentOffset: acc.currentOffset + itemHeight,
          itemIndexesInRange: intersects(itemOffsetRange, visibleOffsetRange)
            ? [...acc.itemIndexesInRange, index]
            : acc.itemIndexesInRange,
        };
      },
      { itemIndexesInRange: [], currentOffset: 0 }
    ).itemIndexesInRange;
    const BUFFER_BEFORE = 5;
    const BUFFER_AFTER = 5;
    return {
      start: clamp(
        0,
        (itemsInRange[0] ?? 0) - BUFFER_BEFORE,
        this.itemHeights.length - 1
      ),
      end: clamp(
        0,
        (last(itemsInRange) ?? 0) + BUFFER_AFTER,
        this.itemHeights.length
      ),
    };
  }
  private updateRenderedRange() {
    if (!this.viewport || !this.viewport.getDataLength()) return;

    const viewportSize = this.viewport.getViewportSize();
    const scrollOffset = this.viewport.measureScrollOffset();
    const newRange = this.getListRangeAt(scrollOffset, viewportSize);
    const oldRange = this.viewport?.getRenderedRange();

    if (isEqual(newRange, oldRange)) return;

    this.viewport.setRenderedRange(newRange);
    this.viewport.setRenderedContentOffset(this.getItemOffset(newRange.start));
    this.scrolledIndexChange$.next(newRange.start);
  }
  private updateTotalContentSize() {
    const contentSize = this.getTotalContentSize();
    this.viewport?.setTotalContentSize(contentSize);
  }
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'cdk-virtual-scroll-viewport[kanbanVirtualScrollStrategy]',
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: (dir: KanbanVirtualScrollDirective) => {
        return dir.scrollStrategy;
      },
      deps: [forwardRef(() => KanbanVirtualScrollDirective)],
    },
  ],
})
export class KanbanVirtualScrollDirective implements OnChanges {
  @Input()
  public itemHeights: ItemHeight = [];

  public scrollStrategy: KanbanVirtualScrollStrategy =
    new KanbanVirtualScrollStrategy(this.itemHeights);

  constructor(private cd: ChangeDetectorRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.itemHeights) {
      this.scrollStrategy.updateItemHeights(this.itemHeights);
      this.cd.detectChanges();
    }
  }
}
