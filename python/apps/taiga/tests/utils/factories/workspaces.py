# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.permissions import choices
from tests.utils import factories as f

from .base import Factory, factory


class WorkspaceFactory(Factory):
    name = factory.Sequence(lambda n: f"workspace {n}")
    owner = factory.SubFactory("tests.utils.factories.UserFactory")

    class Meta:
        model = "workspaces.Workspace"


class WorkspaceMembershipFactory(Factory):
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")
    workspace_role = factory.SubFactory("tests.utils.factories.WorkspaceRoleFactory")

    class Meta:
        model = "workspaces.WorkspaceMembership"


def create_workspace(**kwargs):
    """Create workspace and its dependencies"""
    defaults = {}
    defaults.update(kwargs)

    workspace = WorkspaceFactory.create(**defaults)
    admin_role = f.WorkspaceRoleFactory.create(
        name="Administrators",
        slug="admin",
        permissions=choices.WORKSPACE_PERMISSIONS + choices.WORKSPACE_ADMIN_PERMISSIONS,
        is_admin=True,
        workspace=workspace,
    )
    f.WorkspaceRoleFactory.create(
        name="General Members",
        slug="general-members",
        permissions=choices.WORKSPACE_PERMISSIONS,
        is_admin=False,
        workspace=workspace,
    )
    user = kwargs.pop("owner", f.UserFactory())
    WorkspaceMembershipFactory.create(user=user, workspace=workspace, workspace_role=admin_role)

    return workspace
