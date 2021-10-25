/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import * as faker from 'faker';
import { ProjectCreation } from '..';
import { Milestone } from './milestone.model';
import { MilestoneMockFactory } from './milestone.model.mock';

import { Project } from './project.model';

const getMilestones = () => {
  const milestones: Milestone[] = [];
  for(let i=0; i<faker.datatype.number(); i++) {
    milestones.push(MilestoneMockFactory());
  }
  return milestones;
};

export const ProjectMockFactory = (milestones = false): Project => {
  return {
    id: faker.datatype.number(),
    slug: faker.datatype.string(),
    milestones: milestones ? getMilestones() : [],
    name: faker.datatype.string(),
    description: faker.datatype.string(),
    color: faker.datatype.number(8)
  };
};

export const ProjectCreationMockFactory = (): ProjectCreation => {
  return {
    workspaceSlug: faker.lorem.slug(),
    title: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    color: faker.datatype.number(),
  };
};
