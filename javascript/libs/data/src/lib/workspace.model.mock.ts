/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  rand,
  randDepartment,
  randFirstName,
  randNumber,
  randSlug,
  randUserName,
  randUuid,
  randWord,
  randEmail,
} from '@ngneat/falso';
import { ProjectMockFactory } from '../lib/project.model.mock';
import {
  Workspace,
  WorkspaceMembership,
  InvitationWorkspaceMember,
} from './workspace.model';

export const WorkspaceMockFactory = (): Workspace => {
  const workspace: Workspace = {
    id: randUuid(),
    slug: randSlug(),
    name: randDepartment(),
    color: randNumber(),
    hasProjects: true,
    userRole: 'guest',
    invitedProjects: [],
    latestProjects: [],
    totalProjects: randNumber(),
  };

  const latestProjects = [];
  const invitedProjects = [];
  const numProjects = 6;

  for (let i = 0; i < numProjects; i++) {
    latestProjects.push(
      ProjectMockFactory({
        id: workspace.id,
        color: workspace.color,
        slug: workspace.slug,
        name: workspace.name,
        userRole: workspace.userRole,
      })
    );
  }

  for (let i = 0; i < numProjects; i++) {
    invitedProjects.push(
      ProjectMockFactory({
        id: workspace.id,
        color: workspace.color,
        slug: workspace.slug,
        name: workspace.name,
        userRole: workspace.userRole,
      })
    );
  }

  return {
    ...workspace,
    latestProjects,
    invitedProjects,
    totalProjects: numProjects,
  };
};

export const WorkspaceAdminMockFactory = (): Workspace => {
  const workspace: Workspace = {
    id: randUuid(),
    slug: randSlug(),
    name: randDepartment(),
    color: randNumber(),
    hasProjects: true,
    userRole: 'admin',
    invitedProjects: [],
    latestProjects: [],
    totalProjects: randNumber(),
  };

  const latestProjects = [];
  const invitedProjects = [];
  const numProjects = 6;

  for (let i = 0; i < numProjects; i++) {
    latestProjects.push(
      ProjectMockFactory({
        id: workspace.id,
        color: workspace.color,
        slug: workspace.slug,
        name: workspace.name,
        userRole: workspace.userRole,
      })
    );
  }

  for (let i = 0; i < numProjects; i++) {
    const project = ProjectMockFactory({
      id: workspace.id,
      color: workspace.color,
      slug: workspace.slug,
      name: workspace.name,
      userRole: workspace.userRole,
    });

    invitedProjects.push(project);

    // all the invitations are also in the project list if the user is an admin
    latestProjects.push(project);
  }

  return {
    ...workspace,
    latestProjects,
    invitedProjects,
    totalProjects: numProjects * 2,
  };
};

export const WorkspaceMemberMockFactory = (): Workspace => {
  const workspace: Workspace = {
    id: randUuid(),
    slug: randSlug(),
    name: randDepartment(),
    color: randNumber(),
    hasProjects: true,
    userRole: 'member',
    invitedProjects: [],
    latestProjects: [],
    totalProjects: randNumber(),
  };

  const latestProjects = [];
  const invitedProjects = [];
  const numProjects = 6;

  for (let i = 0; i < numProjects; i++) {
    latestProjects.push(
      ProjectMockFactory({
        id: workspace.id,
        color: workspace.color,
        slug: workspace.slug,
        name: workspace.name,
        userRole: workspace.userRole,
      })
    );
  }

  for (let i = 0; i < numProjects; i++) {
    const project = ProjectMockFactory({
      id: workspace.id,
      color: workspace.color,
      slug: workspace.slug,
      name: workspace.name,
      userRole: workspace.userRole,
    });

    invitedProjects.push(project);

    // all the invitations are also in the project list if the user is a member
    latestProjects.push(project);
  }

  return {
    ...workspace,
    latestProjects,
    invitedProjects,
    totalProjects: numProjects * 2,
  };
};

export const EmptyWorkspaceAdminMockFactory = (): Workspace => {
  const workspace: Workspace = {
    id: randUuid(),
    slug: randSlug(),
    name: randDepartment(),
    color: randNumber(),
    hasProjects: true,
    userRole: 'admin',
    invitedProjects: [],
    latestProjects: [],
    totalProjects: 0,
  };

  return workspace;
};

export const WorkspaceMembershipMockFactory = (): WorkspaceMembership => {
  return {
    user: {
      username: '@' + randUserName(),
      fullName: randFirstName(),
      color: rand([1, 2, 3, 4, 5, 7, 8]),
    },
    workspace: {
      id: randUuid(),
      slug: randSlug(),
      name: randDepartment(),
    },
    role: randWord(),
    projects: [],
  };
};

export const InvitationWorkspaceMemberMockFactory =
  (): InvitationWorkspaceMember => {
    return {
      user: {
        username: '@' + randUserName(),
        fullName: randFirstName(),
        color: rand([1, 2, 3, 4, 5, 7, 8]),
      },
      workspace: {
        id: randUuid(),
        slug: randSlug(),
        name: randDepartment(),
      },
      email: randEmail(),
    };
  };
