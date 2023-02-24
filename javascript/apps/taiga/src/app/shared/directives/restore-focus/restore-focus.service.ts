/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  map,
  of,
  take,
  timeout,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RestoreFocusService {
  private previousFocus = new BehaviorSubject<Map<string, HTMLElement>>(
    new Map()
  );

  public add(key: string, el: HTMLElement) {
    const targetList = this.previousFocus.value;

    targetList.set(key, el);

    this.previousFocus.next(targetList);
  }

  public delete(key: string) {
    const targetList = this.previousFocus.value;

    targetList.delete(key);

    this.previousFocus.next(targetList);
  }

  public focusWhenAvailable(key: string) {
    this.previousFocus
      .pipe(
        map((targetList) => {
          return targetList.get(key);
        }),
        filter((elm): elm is HTMLElement => {
          return !!elm;
        }),
        take(1),
        timeout(2000),
        catchError(() => {
          return of(null);
        })
      )
      .subscribe((elm) => {
        if (elm) {
          requestAnimationFrame(() => {
            elm.focus();
          });
        }
      });
  }
}
