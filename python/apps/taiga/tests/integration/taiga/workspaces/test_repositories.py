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


@pytest.mark.skip(reason="TODO: ProjectFactory")  # delete this when test works
def test_get_workspaces_with_latest_projects_for_owner():
    pass


@pytest.mark.skip(reason="TODO: ProjectFactory")  # delete this when test works
def test_get_workspaces_with_latest_projects_return_last_4_projects_and_total_projects():
    pass


@pytest.mark.skip(reason="TODO: ProjectFactory")  # delete this when test works
def test_get_workspaces_with_latest_projects_order_by_created_date():
    pass


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
