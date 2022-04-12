# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from taiga.permissions import choices

from .base import Factory, factory


class RoleFactory(Factory):
    name = factory.Sequence(lambda n: f"Role {n}")
    slug = factory.Sequence(lambda n: f"test-role-{n}")
    permissions = choices.PROJECT_PERMISSIONS
    is_admin = False
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")

    class Meta:
        model = "users.Role"


@sync_to_async
def create_role(**kwargs):
    return RoleFactory.create(**kwargs)


def build_role(**kwargs):
    return RoleFactory.build(**kwargs)


class WorkspaceRoleFactory(Factory):
    name = factory.Sequence(lambda n: f"WS Role {n}")
    slug = factory.Sequence(lambda n: f"test-ws-role-{n}")
    permissions = choices.WORKSPACE_PERMISSIONS
    is_admin = False
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")

    class Meta:
        model = "users.WorkspaceRole"


@sync_to_async
def create_workspace_role(**kwargs):
    return WorkspaceRoleFactory.create(**kwargs)


class MembershipFactory(Factory):
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")
    role = factory.SubFactory("tests.utils.factories.RoleFactory")

    class Meta:
        model = "projects.Membership"


@sync_to_async
def create_membership(**kwargs):
    return MembershipFactory.create(**kwargs)


class WorkspaceMembershipFactory(Factory):
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")
    workspace_role = factory.SubFactory("tests.utils.factories.WorkspaceRoleFactory")

    class Meta:
        model = "workspaces.WorkspaceMembership"


@sync_to_async
def create_workspace_membership(**kwargs):
    return WorkspaceMembershipFactory.create(**kwargs)
