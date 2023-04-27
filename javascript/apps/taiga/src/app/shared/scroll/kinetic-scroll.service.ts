/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { filter, fromEvent, map, merge, switchMap, takeUntil } from 'rxjs';
import { finalizeWithValue } from '../utils/operators/finalize-with-value';

@Injectable()
export class KineticScrollService {
  private requestAnimationFrame?: ReturnType<typeof requestAnimationFrame>;

  public start(el: HTMLElement, scrollBar: HTMLElement) {
    const movement = fromEvent(el, 'mousedown').pipe(
      filter((event) => {
        return !(event.target as HTMLElement).closest('tg-kanban-story');
      }),
      switchMap((event) => {
        const initScrollPosition = scrollBar.scrollLeft;
        const initMousePosition = (event as MouseEvent).clientX;

        return fromEvent(el, 'mousemove').pipe(
          map((mousemove) => mousemove as MouseEvent),
          takeUntil(
            merge(
              fromEvent(el, 'mouseleave'),
              fromEvent(document.body, 'mouseup')
            )
          ),
          map((mousemove) => {
            const newPosition =
              initScrollPosition + initMousePosition - mousemove.clientX;

            const velocity = newPosition - scrollBar.scrollLeft;

            return {
              mousemove: mousemove,
              initScrollPosition,
              initMousePosition,
              velocity,
            };
          }),
          finalizeWithValue((mouseMoveEvent) => {
            if (this.requestAnimationFrame) {
              cancelAnimationFrame(this.requestAnimationFrame);
            }

            let velocity = mouseMoveEvent.velocity;

            const momentum = () => {
              const left = scrollBar.scrollLeft + velocity * 3;

              scrollBar.scrollTo({ left });

              velocity *= 0.95;
              if (Math.abs(velocity) > 0.5) {
                this.requestAnimationFrame = requestAnimationFrame(momentum);
              }
            };

            momentum();
          })
        );
      })
    );

    movement.subscribe((mouseMoveEvent) => {
      const left =
        mouseMoveEvent.initScrollPosition +
        mouseMoveEvent.initMousePosition -
        mouseMoveEvent.mousemove.clientX;
      scrollBar.scrollTo({ left });
    });
  }
}
