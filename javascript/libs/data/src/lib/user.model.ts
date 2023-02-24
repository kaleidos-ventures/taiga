/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Language } from './language.model';
import { Role } from './roles.model';

export interface User {
  acceptedTerms: boolean;
  bigPhoto: string | null;
  bio: string;
  color: number;
  dateJoined: string;
  email: string;
  fullName: string;
  gravatarId: string;
  id: number;
  isActive: boolean;
  lang: Language['code'];
  maxMembershipsPrivateProjects: number | null;
  maxMembershipsPublicProjects: number | null;
  maxPrivateProjects: number | null;
  maxPublicProjects: number | null;
  photo: string | null;
  readNewTerms: boolean;
  roles: Role['name'][];
  theme: string;
  timezone: string;
  totalPrivateProjects: number;
  totalPublicProjects: number;
  username: string;
  uuid: string;
}
