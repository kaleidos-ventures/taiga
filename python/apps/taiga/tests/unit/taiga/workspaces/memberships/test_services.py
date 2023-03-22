# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch
from uuid import uuid1

import pytest
from taiga.workspaces.memberships import services
from taiga.workspaces.memberships.services import WS_ROLE_NAME_ADMIN, WS_ROLE_NAME_GUEST, WS_ROLE_NAME_NONE
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#######################################################
# list_paginated_workspace_memberships
#######################################################


async def test_list_paginated_workspace_memberships():
    user = await f.create_user()
    workspace = await f.create_workspace()
    workspace_membership = await f.create_workspace_membership(user=user, workspace=workspace)
    project = await f.create_project(workspace=workspace)
    offset = 0
    limit = 10

    with (
        patch("taiga.workspaces.memberships.services.serializer_services", autospec=True) as fake_serializer_services,
        patch("taiga.workspaces.memberships.services.projects_repositories", autospec=True) as fake_pj_repositories,
        patch(
            "taiga.workspaces.memberships.services.workspace_memberships_repositories", autospec=True
        ) as fake_ws_membership_repository,
    ):
        fake_ws_membership_repository.list_workspace_memberships.return_value = [workspace_membership]
        fake_pj_repositories.list_projects.return_value = [project]

        await services.list_paginated_workspace_memberships(workspace=workspace, offset=offset, limit=limit)
        fake_ws_membership_repository.list_workspace_memberships.assert_awaited_once_with(
            filters={"workspace_id": workspace.id},
            select_related=["user", "workspace"],
            offset=offset,
            limit=limit,
        )
        fake_ws_membership_repository.get_total_workspace_memberships.assert_awaited_once_with(
            filters={"workspace_id": workspace.id}
        )
        fake_serializer_services.serialize_workspace_membership_detail.assert_called_once_with(
            user=user,
            workspace=workspace,
            projects=[project],
        )
        fake_pj_repositories.list_projects.assert_awaited_once_with(
            filters={"workspace_id": workspace.id, "project_member_id": user.id}
        )


##########################################################
# misc - get_workspace_role_name
##########################################################


async def test_get_workspace_role_admin():
    workspace_id = uuid1()
    user_id = uuid1()
    with (
        patch(
            "taiga.workspaces.memberships.services.workspace_memberships_repositories", autospec=True
        ) as fake_ws_memberships_repo,
    ):
        fake_ws_memberships_repo.get_workspace_membership.return_value = "Workspace membership"
        ret = await services.get_workspace_role_name(workspace_id=workspace_id, user_id=user_id)

        fake_ws_memberships_repo.get_workspace_membership.assert_awaited_once_with(
            filters={"workspace_id": workspace_id, "user_id": user_id}
        )
        assert ret is WS_ROLE_NAME_ADMIN


async def test_get_workspace_role_name_guest():
    workspace_id = uuid1()
    user_id = uuid1()
    with (
        patch(
            "taiga.workspaces.memberships.services.workspace_memberships_repositories", autospec=True
        ) as fake_ws_memberships_repo,
        patch(
            "taiga.workspaces.memberships.services.projects_memberships_repositories", autospec=True
        ) as fake_pj_memberships_repo,
    ):
        fake_ws_memberships_repo.get_workspace_membership.return_value = None
        fake_pj_memberships_repo.exist_project_membership.return_value = True
        ret = await services.get_workspace_role_name(workspace_id=workspace_id, user_id=user_id)

        fake_ws_memberships_repo.get_workspace_membership.assert_awaited_once_with(
            filters={"workspace_id": workspace_id, "user_id": user_id}
        )
        fake_pj_memberships_repo.exist_project_membership.assert_awaited_once_with(
            filters={"user_id": user_id, "project__workspace_id": workspace_id}
        )
        assert ret is WS_ROLE_NAME_GUEST


async def test_get_workspace_role_no_user():
    workspace_id = uuid1()
    user_id = None
    ret = await services.get_workspace_role_name(workspace_id=workspace_id, user_id=user_id)

    assert ret is WS_ROLE_NAME_NONE


async def test_get_workspace_role_not_a_member():
    workspace_id = uuid1()
    user_id = uuid1()
    with (
        patch(
            "taiga.workspaces.memberships.services.workspace_memberships_repositories", autospec=True
        ) as fake_ws_memberships_repo,
        patch(
            "taiga.workspaces.memberships.services.projects_memberships_repositories", autospec=True
        ) as fake_pj_memberships_repo,
    ):
        fake_ws_memberships_repo.get_workspace_membership.return_value = None
        fake_pj_memberships_repo.exist_project_membership.return_value = False
        ret = await services.get_workspace_role_name(workspace_id=workspace_id, user_id=user_id)

        fake_ws_memberships_repo.get_workspace_membership.assert_awaited_once_with(
            filters={"workspace_id": workspace_id, "user_id": user_id}
        )
        fake_pj_memberships_repo.exist_project_membership.assert_awaited_once_with(
            filters={"user_id": user_id, "project__workspace_id": workspace_id}
        )
        assert ret is WS_ROLE_NAME_NONE
