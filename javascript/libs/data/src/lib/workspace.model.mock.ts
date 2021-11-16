/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Workspace } from './workspace.model';
import * as faker from 'faker';
import { ProjectMockFactory } from '../lib/project.model.mock';

export const WorkspaceMockFactory = (): Workspace => {
  const workspace = {
    id: faker.datatype.number(),
    slug: faker.lorem.slug(),
    name: faker.datatype.string(),
    color: faker.datatype.number(),
  };

  const latestProjects = [];
  const numProjects = 6;

  for (let i = 0; i < numProjects; i++) {
    latestProjects.push(
      ProjectMockFactory(false, {
        color: workspace.color,
        slug: workspace.slug,
        name: workspace.name,
      }));
  }

  return {
    ...workspace,
    latestProjects: latestProjects,
    totalProjects: numProjects * 2,
  };
};
