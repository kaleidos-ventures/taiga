/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  randBoolean,
  randImg,
  randNumber,
  randParagraph,
  randProductName,
  randSlug,
  randUuid,
  randWord,
} from '@ngneat/falso';
import { ProjectCreation, WorkflowMockFactory, Workspace } from '..';
import { Project } from './project.model';
import { WorkspaceMockFactory } from './workspace.model.mock';

export const ProjectMockFactory = (
  workspace?: Pick<Workspace, 'id' | 'color' | 'name' | 'slug' | 'userRole'>
): Project => {
  const project = {
    id: randUuid(),
    name: randWord({ length: 3, capitalize: true }).join(' '),
    slug: randSlug(),
    color: randNumber(),
    description: randParagraph({ length: 3 }).join('\n'),
    workspace: workspace ?? WorkspaceMockFactory(),
    workflows: [WorkflowMockFactory()],
    logo: randImg(),
    logoSmall: randImg(),
    logoLarge: randImg(),
    userIsAdmin: randBoolean(),
    userIsMember: true,
    userHasPendingInvitation: randBoolean(),
    userPermissions: [],
  };

  return project;
};

export const ProjectCreationMockFactory = (): ProjectCreation => {
  return {
    workspaceId: randUuid(),
    name: randProductName(),
    description: randParagraph({ length: 3 }).join('\n'),
    color: randNumber(),
  };
};
