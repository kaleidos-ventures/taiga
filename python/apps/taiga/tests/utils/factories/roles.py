# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from taiga.permissions import choices

from .base import Factory, factory


class ProjectRoleFactory(Factory):
    name = factory.Sequence(lambda n: f"Role {n}")
    slug = factory.Sequence(lambda n: f"test-role-{n}")
    permissions = choices.ProjectPermissions.values
    is_admin = False
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")

    class Meta:
        model = "projects.ProjectRole"


@sync_to_async
def create_project_role(**kwargs):
    return ProjectRoleFactory.create(**kwargs)


def build_project_role(**kwargs):
    return ProjectRoleFactory.build(**kwargs)


class WorkspaceRoleFactory(Factory):
    name = factory.Sequence(lambda n: f"WS Role {n}")
    slug = factory.Sequence(lambda n: f"test-ws-role-{n}")
    permissions = choices.WorkspacePermissions.values
    is_admin = False
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")

    class Meta:
        model = "workspaces.WorkspaceRole"


@sync_to_async
def create_workspace_role(**kwargs):
    return WorkspaceRoleFactory.create(**kwargs)


class ProjectMembershipFactory(Factory):
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")
    role = factory.SubFactory("tests.utils.factories.ProjectRoleFactory")

    class Meta:
        model = "projects.ProjectMembership"


@sync_to_async
def create_project_membership(**kwargs):
    return ProjectMembershipFactory.create(**kwargs)


def build_project_membership(**kwargs):
    return ProjectMembershipFactory.build(**kwargs)


class WorkspaceMembershipFactory(Factory):
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")
    role = factory.SubFactory("tests.utils.factories.WorkspaceRoleFactory")

    class Meta:
        model = "workspaces.WorkspaceMembership"


@sync_to_async
def create_workspace_membership(**kwargs):
    return WorkspaceMembershipFactory.create(**kwargs)
