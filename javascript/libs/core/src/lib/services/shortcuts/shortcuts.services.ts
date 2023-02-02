/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import hotkeys from 'hotkeys-js';
import { Subject } from 'rxjs';
import { finalize, share } from 'rxjs/operators';
import shortcuts from './shortcuts';

@Injectable({
  providedIn: 'root',
})
export class ShortcutsService {
  public scopes: string[] = [];

  public task(taskName: string, options: Parameters<typeof hotkeys>[1] = {}) {
    const subject = new Subject();
    const shortcut = shortcuts.find((it) => it.task === taskName);

    if (shortcut) {
      hotkeys(
        shortcut.defaultKey,
        {
          scope: shortcut.scope,
          ...options,
        },
        (event, handler) => {
          subject.next({ event, handler });
        }
      );

      return subject.pipe(
        finalize(() => {
          hotkeys.unbind(shortcut.defaultKey, shortcut.scope);
          this.deleteScope(shortcut.scope);
        }),
        share()
      );
    } else {
      console.warn(`Shortcut ${taskName} doesn't exist`);
    }

    return subject;
  }

  public setScope(scope: string) {
    hotkeys.setScope(scope);
    this.setFilter();
    this.scopes.push(scope);
  }

  public deleteScope(scope: string) {
    hotkeys.deleteScope(scope);
  }

  public undoLastScope() {
    this.scopes.pop();
    hotkeys.setScope(this.scopes[this.scopes.length - 1]);
    this.setFilter();
  }

  public getScope() {
    return hotkeys.getScope();
  }

  public resetScope() {
    hotkeys.setScope('all');
    this.setFilter();
  }

  public setFilter() {
    // this make it work on inputs and textarea but not on select
    hotkeys.filter = function (event) {
      const tagName = (event.target as HTMLElement).tagName;
      return tagName === 'SELECT' ? false : true;
    };
  }
}
