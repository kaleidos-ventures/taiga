# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from taiga.workspaces import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_workspace_with_latest_projects
##########################################################


def test_get_workspaces_with_latest_projects_for_owner():
    user = f.UserFactory()
    f.WorkspaceFactory(owner=user)
    f.WorkspaceFactory(owner=user)

    workspaces = repositories.get_workspaces_with_latest_projects(owner=user)
    assert len(workspaces) == 2


def test_get_workspaces_with_latest_projects_return_last_6_projects_and_total_projects():
    user = f.UserFactory()
    workspace1 = f.WorkspaceFactory(owner=user)
    workspace2 = f.WorkspaceFactory(owner=user)
    for x in range(7):
        f.ProjectFactory(owner=user, workspace=workspace1)
    for y in range(3):
        f.ProjectFactory(owner=user, workspace=workspace2)

    workspaces = repositories.get_workspaces_with_latest_projects(owner=user)
    assert len(workspaces[0].latest_projects) == 3
    assert workspaces[0].total_projects == 3
    assert len(workspaces[1].latest_projects) == 6
    assert workspaces[1].total_projects == 7


def test_get_workspaces_with_latest_projects_order_by_created_date():
    user = f.UserFactory()
    workspace1 = f.WorkspaceFactory(owner=user)
    workspace2 = f.WorkspaceFactory(owner=user)
    for x in range(2):
        f.ProjectFactory(owner=user, workspace=workspace1)
    for y in range(3):
        f.ProjectFactory(owner=user, workspace=workspace2)

    workspaces = repositories.get_workspaces_with_latest_projects(owner=user)
    assert workspaces[0].created_date > workspaces[1].created_date
    assert workspaces[0].latest_projects[0].created_date > workspaces[0].latest_projects[1].created_date
    assert workspaces[1].latest_projects[0].created_date > workspaces[1].latest_projects[1].created_date


##########################################################
# create_workspace
##########################################################


def test_create_workspace_with_non_ASCI_chars():
    user = f.UserFactory()
    workspace = repositories.create_workspace(name="My w0r#%&乕شspace", color=3, owner=user)
    assert workspace.slug.startswith("my-w0rhu-shspace")


##########################################################
# get_workspace
##########################################################


def test_get_workspace_return_workspace():
    workspace = f.WorkspaceFactory(name="ws 1")
    assert repositories.get_workspace(slug=workspace.slug) == workspace


def test_get_workspace_return_none():
    f.WorkspaceFactory(name="ws 1")
    assert repositories.get_workspace(slug="ws-not-exist") is None
