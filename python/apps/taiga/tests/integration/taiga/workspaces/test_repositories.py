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


@pytest.mark.skip(reason="TODO: ProjectFactory")  # delete this when test works
def test_get_workspaces_with_latest_projects_for_owner():
    pass


@pytest.mark.skip(reason="TODO: ProjectFactory")  # delete this when test works
def test_get_workspaces_with_latest_projects_return_last_4_projects_and_total_projects():
    pass


@pytest.mark.skip(reason="TODO: ProjectFactory")  # delete this when test works
def test_get_workspaces_with_latest_projects_order_by_created_date():
    pass


def test_create_workspace_with_non_ASCI_chars():
    user = f.UserFactory()
    workspace = repositories.create_workspace(name="My w0r#%&乕شspace", color=3, owner=user)
    assert workspace.slug == "my-w0rhu-shspace"


def test_get_workspace_return_workspace():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(name="WS 1", slug="ws-1", color=3, owner=user)
    assert repositories.get_workspace("ws-1") == workspace


def test_get_workspace_return_none():
    user = f.UserFactory()
    f.WorkspaceFactory(name="WS 1", slug="ws-1", color=3, owner=user)
    assert repositories.get_workspace("ws-not-exist") is None
