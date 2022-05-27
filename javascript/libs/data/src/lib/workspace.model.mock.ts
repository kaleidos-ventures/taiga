/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Workspace } from './workspace.model';
import { randDepartment, randNumber, randDomainSuffix } from '@ngneat/falso';
import { ProjectMockFactory } from '../lib/project.model.mock';

export const WorkspaceMockFactory = (): Workspace => {
  const workspace: Workspace = {
    id: randNumber(),
    slug: randDomainSuffix({ length: 3 }).join('-'),
    name: randDepartment(),
    color: randNumber(),
    hasProjects: true,
    myRole: 'admin',
    isPremium: true,
    isOwner: true,
    invitedProjects: [],
    latestProjects: [],
    totalProjects: randNumber(),
  };

  const latestProjects = [];
  const invitedProjects = [];
  const numProjects = 6;

  for (let i = 0; i < numProjects; i++) {
    latestProjects.push(
      ProjectMockFactory(false, {
        color: workspace.color,
        slug: workspace.slug,
        name: workspace.name,
        isPremium: workspace.isPremium,
        myRole: workspace.myRole,
      })
    );
  }

  for (let i = 0; i < numProjects; i++) {
    invitedProjects.push(
      ProjectMockFactory(false, {
        color: workspace.color,
        slug: workspace.slug,
        name: workspace.name,
        isPremium: workspace.isPremium,
        myRole: workspace.myRole,
      })
    );
  }

  return {
    ...workspace,
    latestProjects,
    invitedProjects,
    totalProjects: numProjects * 2,
  };
};
