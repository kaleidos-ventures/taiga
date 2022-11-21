# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from taiga.permissions import choices

from .base import Factory, factory

# WORKSPACE ROLE


class WorkspaceRoleFactory(Factory):
    name = factory.Sequence(lambda n: f"WS Role {n}")
    slug = factory.Sequence(lambda n: f"test-ws-role-{n}")
    permissions = choices.WorkspacePermissions.values
    is_admin = False
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")

    class Meta:
        model = "workspaces_roles.WorkspaceRole"


@sync_to_async
def create_workspace_role(**kwargs):
    return WorkspaceRoleFactory.create(**kwargs)


def build_workspace_role(**kwargs):
    return WorkspaceRoleFactory.build(**kwargs)


# WORKSPACE MEMBERSHIP


class WorkspaceMembershipFactory(Factory):
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")
    role = factory.SubFactory("tests.utils.factories.WorkspaceRoleFactory")

    class Meta:
        model = "workspaces_memberships.WorkspaceMembership"


@sync_to_async
def create_workspace_membership(**kwargs):
    return WorkspaceMembershipFactory.create(**kwargs)


def build_workspace_membership(**kwargs):
    return WorkspaceMembershipFactory.build(**kwargs)


# WORKSPACE


class WorkspaceFactory(Factory):
    name = factory.Sequence(lambda n: f"workspace {n}")
    owner = factory.SubFactory("tests.utils.factories.UserFactory")
    is_premium = False

    class Meta:
        model = "workspaces.Workspace"


@sync_to_async
def create_workspace(**kwargs):
    """Create workspace and its dependencies"""
    defaults = {}
    defaults.update(kwargs)

    workspace = WorkspaceFactory.create(**defaults)
    admin_role = WorkspaceRoleFactory.create(
        name="Administrator",
        slug="admin",
        permissions=choices.WorkspacePermissions.values,
        is_admin=True,
        workspace=workspace,
    )
    WorkspaceRoleFactory.create(
        name="Members",
        slug="member",
        permissions=choices.WorkspacePermissions.values,
        is_admin=False,
        workspace=workspace,
    )

    WorkspaceMembershipFactory.create(user=workspace.owner, workspace=workspace, role=admin_role)

    return workspace


def build_workspace(**kwargs):
    return WorkspaceFactory.build(**kwargs)
