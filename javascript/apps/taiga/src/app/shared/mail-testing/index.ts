/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

interface TestEmailEvent {
  subject: string;
  to: string;
  previewUrl: string;
  localPreview: string;
}

export const init = (url?: string) => {
  const ws = new WebSocket(url ?? 'ws://localhost:8090');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data as string) as TestEmailEvent;

    if (data.subject) {
      console.log(`
Subject: ${data.subject}
To: ${data.to}
Preview URL: ${data.previewUrl}`);
    }
  };
};
