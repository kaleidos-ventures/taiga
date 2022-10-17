/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { User } from '@taiga/data';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class UserStorageService {
  private prefix = '';

  constructor(public localStorageService: LocalStorageService) {
    this.refreshPrefix();
  }

  public refreshPrefix() {
    const user = LocalStorageService.get<User>('user');

    const prefix = user?.username ? `${window.btoa(user.username)}_` : '';

    this.setPrefix(prefix);
  }

  public get<T>(key: string): T | undefined {
    return LocalStorageService.get(this.prefix + key);
  }

  public set(key: string, newValue?: unknown) {
    return this.localStorageService.set(this.prefix + key, newValue);
  }

  public remove(key: string) {
    return this.localStorageService.remove(this.prefix + key);
  }

  public contains(key: string) {
    return this.localStorageService.contains(this.prefix + key);
  }

  public clear() {
    this.localStorageService.clear();
  }

  public setPrefix(prefix: string) {
    this.prefix = prefix;
  }
}
