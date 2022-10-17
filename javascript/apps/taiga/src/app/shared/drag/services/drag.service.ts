/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import {
  animationFrameScheduler,
  BehaviorSubject,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  pairwise,
  scan,
  share,
  skip,
  Subject,
  take,
  takeUntil,
  tap,
  throttleTime,
} from 'rxjs';
import { DraggableDirective } from '../directives/draggable.directive';
import { DropZoneDirective } from '../directives/drop-zone.directive';
import { DropCandidate, DroppedEvent, OverEvent } from '../drag.model';
import { DragInProgressComponent } from '../components/drag-in-progress.component';

interface Point {
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root',
})
export class DragService {
  private over$ = new BehaviorSubject(undefined) as BehaviorSubject<OverEvent>;
  private elements$ = new BehaviorSubject([] as DraggableDirective[]);
  private position$ = new BehaviorSubject<Point | null>(null);
  private dropZone$ = new BehaviorSubject(undefined) as BehaviorSubject<
    DropZoneDirective | undefined
  >;

  private dropZones: DropZoneDirective[] = [];
  private dropped$ = new Subject<DroppedEvent>();
  private started$ = new Subject<unknown>();
  private source: { data: unknown; id: unknown }[] = [];
  private dragInProgress!: DragInProgressComponent;
  private initialZone?: DropZoneDirective;

  public over() {
    return this.over$.asObservable();
  }

  public dropped() {
    return this.dropped$.asObservable();
  }

  public started<T>() {
    return this.started$.asObservable() as Observable<T>;
  }

  public elements() {
    return this.elements$.asObservable();
  }

  public elementsValue() {
    return this.elements$.value;
  }

  public dropZone() {
    return this.dropZone$.asObservable();
  }

  public dropZoneValue() {
    return this.dropZone$.value;
  }

  public addDropZone(dropZone: DropZoneDirective) {
    this.dropZones.push(dropZone);
  }

  public deleteDropZone(dropZone: DropZoneDirective) {
    this.dropZones = this.dropZones.filter((it) => it !== dropZone);
  }

  public position() {
    return this.position$.asObservable() as Observable<{
      x: number;
      y: number;
    } | null>;
  }

  public add(el: DraggableDirective) {
    this.elements$.next([...this.elements$.value, el]);
  }

  public setDragInProgress(dragInProgress: DragInProgressComponent) {
    this.dragInProgress = dragInProgress;
  }

  public clearCurrentDropZone() {
    this.dropZone$.next(undefined);
    this.newOver(undefined);
  }

  public setCurrentDropZone(zone: DropZoneDirective) {
    this.dropZone$.next(zone);
  }

  public setPosition(x: number, y: number) {
    this.position$.next({
      x,
      y,
    });
  }

  public newOver(event: OverEvent) {
    const last = this.over$.value;

    if (
      last?.dropZone !== event?.dropZone ||
      last?.over?.position !== event?.over?.position ||
      last?.over?.result !== event?.over?.result
    ) {
      this.over$.next(event);
    }
  }

  public dragEnded() {
    this.elements$.next([]);
    this.dropZone$.next(undefined);
    this.over$.next(undefined);
  }

  public newDragPosition(rect: DOMRect) {
    const point = this.getCenter(rect);
    this.updateDropZone(point);

    if (!this.dropZone$.value) {
      return;
    }

    const candidate = this.findCandidate(point);
    const lastCandidate = this.over$.value;
    const candidates = this.dropZone$.value.getCandidates();
    const isZoneEmpty = !candidates.length;

    if (candidate) {
      this.newOver({
        dropZone: this.dropZone$.value.id,
        over: candidate,
        source: this.source.map((it) => it.data),
      });
    } else if (
      lastCandidate?.dropZone !== this.dropZone$.value.id &&
      isZoneEmpty
    ) {
      // empty column
      this.newOver({
        dropZone: this.dropZone$.value.id,
        over: undefined,
        source: this.source.map((it) => it.data),
      });
    } else if (
      this.initialZone === this.dropZone$.value &&
      candidates.length === 1
    ) {
      // the only item in the column is the dragging element
      this.newOver({
        dropZone: this.dropZone$.value.id,
        over: undefined,
        source: this.source.map((it) => it.data),
      });
    }
  }

  public dragStart(draggableDirective: DraggableDirective) {
    this.initialZone = draggableDirective.dropZone;

    this.dragInProgress.nativeElement.style.width = `${
      draggableDirective.nativeElement.getBoundingClientRect().width
    }px`;

    let initialPosition = { x: 0, y: 0 };

    const mouseUp$ = fromEvent(document.body, 'mouseup').pipe(map(() => false));

    const mouseMove$ = fromEvent<MouseEvent>(document.body, 'mousemove').pipe(
      share(),
      tap((mouseMove) => {
        mouseMove.preventDefault();
      }),
      pairwise(),
      map(([oldMouseMove, mouseMove]) => {
        return {
          x: oldMouseMove.clientX - mouseMove.clientX,
          y: oldMouseMove.clientY - mouseMove.clientY,
        };
      }),
      scan(
        (acc, curr) => {
          return {
            x: acc.x - curr.x,
            y: acc.y - curr.y,
          };
        },
        {
          x: 0,
          y: 0,
        }
      ),
      map((mouseMove) => {
        return {
          x: initialPosition.x + mouseMove.x,
          y: initialPosition.y + mouseMove.y,
        };
      }),
      filter((mouseMove) => {
        return (
          mouseMove.x > 5 ||
          mouseMove.x < -5 ||
          mouseMove.y > 5 ||
          mouseMove.y < -5
        );
      })
    );

    const escape$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      filter((e) => e.key === 'Escape'),
      share()
    );

    merge(
      escape$.pipe(
        map(() => {
          return {
            dropZone: undefined,
            source: this.source.map((it) => it.data),
            candidate: undefined,
          };
        })
      ),
      mouseUp$.pipe(
        map(() => {
          const lastOverEvent = this.over$.value;

          return {
            dropZone: this.dropZone$.value?.id,
            source: this.source.map((it) => it.data),
            candidate: lastOverEvent?.over,
          };
        })
      )
    )
      .pipe(take(1))
      .subscribe((drop) => {
        if (this.elements$.value.length) {
          this.dropped$.next(drop);
          this.dragEnded();
        }
      });

    mouseMove$
      .pipe(
        takeUntil(merge(escape$, mouseUp$)),
        skip(1),
        throttleTime(0, animationFrameScheduler)
      )
      .subscribe((position) => {
        this.setPosition(position.x, position.y);
      });

    mouseMove$
      .pipe(takeUntil(merge(escape$, mouseUp$)), take(1))
      .subscribe(() => {
        this.add(draggableDirective);

        initialPosition =
          draggableDirective.nativeElement.getBoundingClientRect();

        this.source = this.elements$.value.map((it) => {
          return {
            id: it.id,
            data: it.dragData,
          };
        });

        this.setPosition(initialPosition.x, initialPosition.y);
        this.started$.next(draggableDirective.dragData);
      });
  }

  private findDropZone(point: Point) {
    return this.dropZones.find((dropZone) => {
      const rect = dropZone.nativeElement.getBoundingClientRect();

      return (
        point.x > rect.x &&
        point.x < rect.right &&
        point.y > rect.y &&
        point.y < rect.bottom
      );
    });
  }

  private updateDropZone(point: Point) {
    const dropZone = this.findDropZone(point);

    if (dropZone) {
      this.setCurrentDropZone(dropZone);
    }
  }

  private findCandidate(point: Point): DropCandidate | undefined {
    const candidates = this.dropZone$.value?.getCandidates() ?? [];

    const validCandidates = candidates.filter((candidate) => {
      return !candidate.dragDisabled;
    });

    const currentIndex = validCandidates.findIndex((candidate) => {
      return this.source.find((it) => it.id === candidate.id);
    });

    const candidateIndex = validCandidates.findIndex((candidate, index) => {
      if (index === currentIndex) {
        return false;
      }

      const candidateRect = candidate.nativeElement.getBoundingClientRect();
      const overlapping = this.isOverlapping(point, candidateRect);

      return overlapping;
    });

    if (candidateIndex !== -1) {
      const candidate = validCandidates[candidateIndex];
      const candidateRect = candidate.nativeElement.getBoundingClientRect();

      return {
        position: this.overlappingPosition(point, candidateRect),
        result: candidate.dragData,
      };
    }

    return undefined;
  }

  private overlappingPosition(point: Point, rect: DOMRect) {
    if (point.y - rect.top < rect.bottom - point.y) {
      return 'top';
    }

    return 'bottom';
  }

  private isOverlapping(point: Point, rect: DOMRect) {
    const size = 15;
    const target = [
      { x: point.x - size, y: point.y - size },
      { x: point.x + size, y: point.y - size },
      { x: point.x - size, y: point.y + size },
      { x: point.x + size, y: point.y + size },
    ];

    return !!target.find((it) => {
      return (
        it.x < rect.right &&
        it.x > rect.x &&
        it.y < rect.bottom &&
        it.y > rect.y
      );
    });
  }

  private getCenter(rect: DOMRect) {
    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
  }
}
