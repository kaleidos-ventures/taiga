/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

interface TestEmailEvent {
  previewUrl?: string;
}

export const init = () => {
  const ws = new WebSocket('ws://localhost:8090');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data as string) as TestEmailEvent;

    if (data.previewUrl) {
      console.log(`New email: ${data.previewUrl}`);
    }
  };
};
