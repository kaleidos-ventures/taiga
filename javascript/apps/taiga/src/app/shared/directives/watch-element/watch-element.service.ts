/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

type WatchElm = Record<'string', HTMLElement>;

@Injectable({
  providedIn: 'root',
})
export class WatchElementService {
  public elements$ = new BehaviorSubject({} as WatchElm);

  public add(id: string, elm: HTMLElement) {
    const newObj = {
      ...this.elements$.value,
      [id]: elm,
    };

    this.elements$.next(newObj);
  }

  public remove(id: string) {
    const newObj: Partial<WatchElm> = {
      ...this.elements$.value,
    };

    delete newObj[id as keyof WatchElm];

    this.elements$.next(newObj as WatchElm);
  }

  public watchId(id: string) {
    return this.elements$.asObservable().pipe(
      map((elements) => {
        return elements[id as keyof WatchElm];
      })
    );
  }
}
