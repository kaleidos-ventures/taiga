/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  public get<T>(key: string): T | undefined {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        return JSON.parse(item) as T;
      } catch (error) {
        return undefined;
      }
    }
    return undefined;
  }

  public set(key: string, newValue?: unknown) {
    localStorage.setItem(key, JSON.stringify(newValue));
  }

  public remove(key: string) {
    localStorage.removeItem(key);
  }

  public contains(key: string) {
    return localStorage.getItem(key) !== undefined;
  }

  public clear() {
    localStorage.clear();
  }
}
