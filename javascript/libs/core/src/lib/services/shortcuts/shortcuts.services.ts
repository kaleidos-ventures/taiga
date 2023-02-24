/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import hotkeys from 'hotkeys-js';
import { Subject } from 'rxjs';
import { finalize, share } from 'rxjs/operators';
import shortcuts from './shortcuts';

hotkeys.filter = function (event) {
  const tagName = (event.target as HTMLElement).tagName;
  return tagName === 'SELECT' ? false : true;
};

@Injectable({
  providedIn: 'root',
})
export class ShortcutsService {
  public static shortcuts = shortcuts;

  private debug = false;

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
    this.scopes.push(scope);

    if (this.debug) {
      console.log('setScope', scope);
    }
  }

  public deleteScope(scope: string) {
    hotkeys.deleteScope(scope);

    this.scopes = this.scopes.filter((it) => it !== scope);

    if (this.debug) {
      console.log('deleteScope', scope);
    }
  }

  public undoLastScope() {
    if (this.debug) {
      console.log('undoLastScope', this.scopes);
    }

    this.scopes.pop();
    hotkeys.setScope(this.scopes[this.scopes.length - 1]);

    if (this.debug) {
      console.log('undoLastScope set', this.scopes[this.scopes.length - 1]);
    }
  }

  public undoScope(scope: string) {
    if (this.debug) {
      console.log('undoScope', this.scopes);
    }

    this.scopes = this.scopes.filter((it) => it !== scope);

    hotkeys.setScope(this.scopes[this.scopes.length - 1]);

    if (this.debug) {
      console.log('undoScope set', this.scopes[this.scopes.length - 1]);
    }
  }

  public getScope() {
    return hotkeys.getScope();
  }

  public resetScope() {
    hotkeys.setScope('all');

    if (this.debug) {
      console.log('resetScope');
    }
  }
}
