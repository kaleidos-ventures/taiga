/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  randSlug,
  randNumber,
  randWord,
  randParagraph,
  randImg,
  randProductName,
  randBoolean,
} from '@ngneat/falso';
import { ProjectCreation, Workspace } from '..';
import { Milestone } from './milestone.model';
import { MilestoneMockFactory } from './milestone.model.mock';

import { Project } from './project.model';
import { WorkspaceMockFactory } from './workspace.model.mock';

const getMilestones = () => {
  const milestones: Milestone[] = [];
  for (let i = 0; i < randNumber(); i++) {
    milestones.push(MilestoneMockFactory());
  }
  return milestones;
};

export const ProjectMockFactory = (
  milestones = false,
  workspace?: Pick<
    Workspace,
    'color' | 'name' | 'slug' | 'isPremium' | 'myRole'
  >
): Project => {
  const project = {
    name: randWord({ length: 3, capitalize: true }).join(' '),
    slug: randSlug(),
    milestones: milestones ? getMilestones() : [],
    color: randNumber(),
    description: randParagraph({ length: 3 }).join('\n'),
    workspace: workspace ?? WorkspaceMockFactory(),
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
    workspaceSlug: randSlug(),
    name: randProductName(),
    description: randParagraph({ length: 3 }).join('\n'),
    color: randNumber(),
  };
};
