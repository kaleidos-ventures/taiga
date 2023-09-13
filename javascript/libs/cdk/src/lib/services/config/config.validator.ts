/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import * as z from 'zod';

export const ConfigValidator = z.object({
  api: z.string().url().default('http://127.0.0.1:8000/api/v2'),
  ws: z.string().url().default('ws://127.0.0.1:8000/events/'),
  supportEmail: z.string().email().default('support@taiga.io'),
  emailWs: z.string().url().optional(),
  social: z
    .object({
      github: z.object({
        serverUrl: z.string().url().optional(),
        clientId: z.string().default(''),
      }),
      gitlab: z.object({
        serverUrl: z.string().url().optional(),
        clientId: z.string().default(''),
      }),
      google: z.object({
        serverUrl: z.string().url().optional(),
        clientId: z.string().default(''),
      }),
    })
    .default({
      github: {
        clientId: '',
      },
      gitlab: {
        clientId: '',
      },
      google: {
        clientId: '',
      },
    }),
  accessTokenLifetime: z.number().default(180),
  globalBanner: z.boolean().default(false),
  maxUploadFileSize: z.number().default(104857600),
});
