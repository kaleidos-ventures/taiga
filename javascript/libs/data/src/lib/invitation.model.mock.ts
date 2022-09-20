/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  randBoolean,
  randEmail,
  randFullName,
  randUserName,
} from '@ngneat/falso';
import { Contact, Invitation, InvitationInfo } from './invitation.model';
import { MembershipMockFactory } from './membership.model.mock';
import { ProjectMockFactory } from './project.model.mock';

export const InvitationMockFactory = (): Invitation => {
  return {
    ...MembershipMockFactory(),
    email: randEmail(),
  };
};

export const InvitationInfoMockFactory = (): InvitationInfo => {
  const project = ProjectMockFactory();
  return {
    status: 'pending',
    email: randEmail(),
    existingUser: randBoolean(),
    project: {
      name: project.name,
      slug: project.slug,
      anonUserCanView: randBoolean(),
    },
  };
};

export const RegisteredContactMockFactory = (): Contact => {
  return {
    fullName: randFullName(),
    username: randUserName(),
  };
};
