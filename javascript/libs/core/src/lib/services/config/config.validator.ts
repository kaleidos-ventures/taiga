/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import * as z from 'zod';

export const ConfigValidator = z.object({
  api: z.string(),
  ws: z.string(),
  adminEmail: z.string(),
  supportEmail: z.string(),
  emailWs: z.string().optional(),
  social: z.object({
    github: z.object({
      serverUrl: z.string().optional(),
      clientId: z.string(),
    }),
    gitlab: z.object({
      serverUrl: z.string().optional(),
      clientId: z.string(),
    }),
    google: z.object({
      serverUrl: z.string().optional(),
      clientId: z.string(),
    }),
  }),
  accessTokenLifetime: z.number(),
  globalBanner: z.boolean(),
});
