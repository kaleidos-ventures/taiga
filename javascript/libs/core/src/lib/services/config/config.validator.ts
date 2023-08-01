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
