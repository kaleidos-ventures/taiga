/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
 */

import { Injectable } from '@angular/core';
import shortcuts from './shortcuts';
import hotkeys from 'hotkeys-js';
import { Subject } from 'rxjs';
import { share, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ShortcutsService {
  public task(taskName: string, options: Parameters<typeof hotkeys>[1] = {}) {
    const subject = new Subject();
    const shortcut = shortcuts.find((it) => it.task === taskName);

    if (shortcut) {
      hotkeys(shortcut.defaultKey, {
        scope: shortcut.scope,
        ...options
      }, (event, handler) => {
        subject.next({event, handler});
      });

      return subject.pipe(
        finalize(() => {
          hotkeys.unbind(shortcut.defaultKey, shortcut.scope);
          this.resetScope();
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
  }

  public resetScope() {
    hotkeys.setScope('all');
  }
}
