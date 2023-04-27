/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import {
  finalize,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  scan,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { DragService } from './drag.service';
import { RxVirtualScrollViewportComponent } from '@rx-angular/template/experimental/virtual-scrolling';

@Injectable({
  providedIn: 'root',
})
export class AutoScrollService {
  constructor(private dragService: DragService) {}

  public listenHtmlElement(
    element: HTMLElement,
    type: 'horizontal' | 'vertical' = 'horizontal',
    listenRange = 300,
    speedModifier = 1
  ) {
    const getScroll = () => {
      if (type === 'horizontal') {
        return element.scrollLeft;
      }

      return element.scrollTop;
    };

    const scrollTo = (position: number) => {
      console.log('scroll toooo', type);
      if (type === 'horizontal') {
        element.scrollTo(position, 0);
      } else {
        element.scrollTo(0, position);
      }
    };

    const scrollableElement = () => {
      return element;
    };

    return this.listen(
      getScroll,
      scrollTo,
      scrollableElement,
      type,
      listenRange,
      speedModifier
    );
  }

  public listenVirtualScrollElement(
    virtualScroll: RxVirtualScrollViewportComponent,
    type: 'horizontal' | 'vertical' = 'horizontal',
    listenRange = 300,
    speedModifier = 1
  ) {
    const getScroll = () => {
      return virtualScroll.getScrollTop();
    };

    const scrollTo = (position: number) => {
      virtualScroll.scrollTo(position);
    };

    const scrollableElement = () => {
      return virtualScroll.scrollContainer();
    };

    return this.listen(
      getScroll,
      scrollTo,
      scrollableElement,
      type,
      listenRange,
      speedModifier
    );
  }

  public listen(
    getScroll: (type: string) => number,
    scrollTo: (position: number) => void,
    scrollableElement: () => HTMLElement,
    type: 'horizontal' | 'vertical' = 'horizontal',
    listenRange = 300,
    speedModifier = 1
  ) {
    return new Observable(() => {
      let lastAnimationFrame: number;
      let speed = 1;
      let lastTime = 0;
      let dir: 'inc' | 'dec' = 'inc';

      const cancelScrollLoop = () => {
        if (lastAnimationFrame) {
          cancelAnimationFrame(lastAnimationFrame);
          lastTime = 0;
          lastAnimationFrame = 0;
        }
      };

      const scrollLoop = () => {
        lastAnimationFrame = requestAnimationFrame(() => {
          const time = new Date().getTime();
          let delta = 0;

          if (lastTime) {
            delta = time - lastTime;
          }

          lastTime = time;

          if (type === 'horizontal') {
            const scrollLeft = getScroll(type);

            let left = 0;
            if (dir === 'inc') {
              left = scrollLeft + delta * speed;
            } else {
              left = scrollLeft - delta * speed;
            }

            scrollTo(left);
          } else {
            const scrollTop = getScroll(type);

            let top = 0;

            if (dir === 'inc') {
              top = scrollTop + delta * speed;
            } else {
              top = scrollTop - delta * speed;
            }

            scrollTo(top);
          }

          scrollLoop();
        });
      };

      const position$ = fromEvent<MouseEvent>(document.body, 'mousemove').pipe(
        map((event) => {
          return {
            x: event.clientX,
            y: event.clientY,
          };
        }),
        scan(
          (acc, position) => {
            if (!acc.startingPosition.x) {
              return {
                startingPosition: position,
                position,
              };
            }

            return {
              ...acc,
              position,
            };
          },
          {
            startingPosition: {
              x: 0,
              y: 0,
            },
            position: {
              x: 0,
              y: 0,
            },
          }
        ),
        takeUntil(this.dragService.dropped()),
        finalize(() => {
          cancelScrollLoop();
        })
      );

      const obs = [this.dragService.started()];

      const isDragAndDropInProgress = !!this.dragService.elementsValue().length;

      if (isDragAndDropInProgress) {
        obs.push(of(true));
      }

      const subscription = merge(...obs)
        .pipe(
          tap(() => {
            cancelScrollLoop();
          }),
          switchMap(() => position$)
        )
        .subscribe(({ startingPosition, position }) => {
          const rposition = this.getRelativePosition(position, type);
          const rstartingPosition = this.getRelativePosition(
            startingPosition,
            type
          );

          if (!lastAnimationFrame) {
            if (
              rposition < rstartingPosition + 10 &&
              rposition > rstartingPosition - 10
            ) {
              return;
            }
          }

          const scrollPosition = scrollableElement().getBoundingClientRect();
          const rscrollPosition = this.getRelativeScrollPosition(
            scrollPosition,
            type
          );

          if (type === 'horizontal') {
            console.log(position, type, rposition, rscrollPosition.end);
          }

          // console.log(
          //   position.y > scrollPosition.top &&
          //     position.y < scrollPosition.bottom,
          //   position.x < scrollPosition.right &&
          //     position.x > scrollPosition.left
          // );

          if (
            position.y > scrollPosition.top &&
            position.y < scrollPosition.bottom &&
            position.x < scrollPosition.right &&
            position.x > scrollPosition.left
          ) {
            if (
              rposition > rscrollPosition.end - listenRange &&
              rposition < rscrollPosition.end
            ) {
              dir = 'inc';

              if (!lastAnimationFrame) {
                scrollLoop();
                return;
              } else {
                const range = rposition - (rscrollPosition.end - listenRange);

                speed =
                  +(((range / listenRange) * 100) / 100).toFixed(2) *
                  speedModifier;

                return;
              }
            }

            if (
              rposition > rscrollPosition.start &&
              rposition < rscrollPosition.start + listenRange
            ) {
              dir = 'dec';

              if (!lastAnimationFrame) {
                scrollLoop();
                return;
              } else {
                const range = rscrollPosition.start + listenRange - rposition;

                speed =
                  +(((range / listenRange) * 100) / 100).toFixed(2) *
                  speedModifier;
                return;
              }
            }
          }

          cancelScrollLoop();
        });

      return {
        unsubscribe() {
          subscription.unsubscribe();
        },
      };
    });
  }

  public getRelativePosition(
    position: { x: number; y: number },
    type: 'horizontal' | 'vertical'
  ) {
    if (type === 'horizontal') {
      return position.x;
    }

    return position.y;
  }

  public getRelativeScrollPosition(
    position: DOMRect,
    type: 'horizontal' | 'vertical'
  ) {
    if (type === 'horizontal') {
      return {
        start: position.left,
        end: position.right,
      };
    }
    return {
      start: position.top,
      end: position.bottom,
    };
  }
}
