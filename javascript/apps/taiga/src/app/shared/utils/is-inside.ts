/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

export function isInside(element: HTMLElement, wrapper: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();

  return (
    rect.top >= wrapperRect.top &&
    rect.bottom <= wrapperRect.bottom &&
    rect.left >= wrapperRect.left &&
    rect.right <= wrapperRect.right
  );
}
