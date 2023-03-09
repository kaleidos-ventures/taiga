# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from asgiref.sync import sync_to_async

from .base import Factory, factory

# WORKSPACE MEMBERSHIP


class WorkspaceMembershipFactory(Factory):
    user = factory.SubFactory("tests.utils.factories.UserFactory")
    workspace = factory.SubFactory("tests.utils.factories.WorkspaceFactory")

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
    created_by = factory.SubFactory("tests.utils.factories.UserFactory")

    class Meta:
        model = "workspaces.Workspace"


@sync_to_async
def create_workspace(**kwargs):
    """Create workspace and its dependencies"""
    defaults = {}
    defaults.update(kwargs)

    workspace = WorkspaceFactory.create(**defaults)
    WorkspaceMembershipFactory.create(user=workspace.created_by, workspace=workspace)

    return workspace


def build_workspace(**kwargs):
    return WorkspaceFactory.build(**kwargs)
