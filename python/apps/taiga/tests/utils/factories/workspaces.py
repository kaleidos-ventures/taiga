# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from taiga.permissions import choices
from tests.utils import factories as f

from .base import Factory, factory


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
    admin_role = f.WorkspaceRoleFactory.create(
        name="Administrators",
        slug="admin",
        permissions=choices.WORKSPACE_PERMISSIONS,
        is_admin=True,
        workspace=workspace,
    )
    f.WorkspaceRoleFactory.create(
        name="Members",
        slug="member",
        permissions=choices.WORKSPACE_PERMISSIONS,
        is_admin=False,
        workspace=workspace,
    )

    f.WorkspaceMembershipFactory.create(user=workspace.owner, workspace=workspace, workspace_role=admin_role)

    return workspace
