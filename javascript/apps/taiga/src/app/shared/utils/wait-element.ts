/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Observable } from 'rxjs';

export function waitElement(selector: string, timeout = 1000) {
  const findElement = () => {
    return document.querySelector(selector);
  };

  return new Observable((subscriber) => {
    const el = findElement();

    if (el) {
      subscriber.next(el);
      subscriber.complete();
    }

    const timeouId = setTimeout(() => {
      subscriber.complete();
      observer.disconnect();
    }, timeout);

    const observer = new MutationObserver(() => {
      const el = findElement();

      if (el) {
        clearTimeout(timeouId);
        subscriber.next(el);
        subscriber.complete();
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  });
}
