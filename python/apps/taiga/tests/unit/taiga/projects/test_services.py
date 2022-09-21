# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import MagicMock, patch

import pytest
from fastapi import UploadFile
from taiga.projects import services
from taiga.projects.services import exceptions as ex
from taiga.users.models import AnonymousUser
from tests.utils import factories as f
from tests.utils.images import valid_image_upload_file

pytestmark = pytest.mark.django_db


##########################################################
# get_workspace_projects_for_user
##########################################################


async def test_get_workspace_projects_for_user_admin():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    with (patch("taiga.projects.services.projects_repositories", autospec=True) as fake_projects_repo,):
        await services.get_workspace_projects_for_user(workspace=workspace, user=user)
        fake_projects_repo.get_projects.assert_awaited_once_with(workspace_slug=workspace.slug)


async def test_get_workspace_projects_for_user_member():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    with (
        patch("taiga.projects.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.projects.services.projects_repositories", autospec=True) as fake_projects_repo,
    ):
        fake_roles_repo.get_workspace_role_for_user.return_value = MagicMock(is_admin=False)
        await services.get_workspace_projects_for_user(workspace=workspace, user=user)
        fake_projects_repo.get_workspace_projects_for_user.assert_awaited_once_with(
            workspace_id=workspace.id, user_id=user.id
        )


##########################################################
# get_workspace_invited_projects_for_user
##########################################################


async def test_get_workspace_invited_projects_for_user():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    with patch("taiga.projects.services.projects_repositories", autospec=True) as fake_projects_repo:
        await services.get_workspace_invited_projects_for_user(workspace=workspace, user=user)
        fake_projects_repo.get_workspace_invited_projects_for_user.assert_awaited_once_with(
            workspace_id=workspace.id, user_id=user.id
        )


##########################################################
# create_project
##########################################################


async def test_create_project():
    workspace = await f.create_workspace()

    with (
        patch("taiga.projects.services.projects_repositories", autospec=True) as fake_project_repository,
        patch("taiga.projects.services.roles_repositories", autospec=True) as fake_role_repository,
    ):
        fake_project_repository.create_project.return_value = await f.create_project()

        await services.create_project(workspace=workspace, name="n", description="d", color=2, owner=workspace.owner)

        fake_project_repository.create_project.assert_awaited_once()
        fake_project_repository.get_template.assert_awaited_once()
        fake_role_repository.get_project_role.assert_awaited_once()
        fake_role_repository.create_project_membership.assert_awaited_once()


async def test_create_project_with_logo():
    workspace = await f.create_workspace()
    project = await f.create_project(workspace=workspace)
    role = await f.create_project_role(project=project)

    logo: UploadFile = valid_image_upload_file

    with (
        patch("taiga.projects.services.projects_repositories", autospec=True) as fake_project_repository,
        patch("taiga.projects.services.roles_repositories", autospec=True) as fake_roles_repository,
    ):
        fake_project_repository.create_project.return_value = project
        fake_roles_repository.get_project_role.return_value = role

        await services.create_project(
            workspace=workspace, name="n", description="d", color=2, owner=workspace.owner, logo=logo
        )

        service_file_param = fake_project_repository.create_project.call_args_list[0][1]
        assert service_file_param["logo"].name == logo.filename
        assert service_file_param["logo"].file == logo.file


async def test_create_project_with_no_logo():
    workspace = await f.create_workspace()

    with patch("taiga.projects.services.projects_repositories", autospec=True) as fake_project_repository, patch(
        "taiga.projects.services.roles_repositories", autospec=True
    ):
        fake_project_repository.create_project.return_value = await f.create_project()
        await services.create_project(workspace=workspace, name="n", description="d", color=2, owner=workspace.owner)

        fake_project_repository.create_project.assert_awaited_once_with(
            workspace=workspace, name="n", description="d", color=2, owner=workspace.owner, logo=None
        )


##########################################################
# get_project_detail
##########################################################


async def test_get_project_detail():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    project = await f.create_project(owner=user, workspace=workspace)

    with (
        patch("taiga.projects.services.permissions_services", autospec=True) as fake_permissions_services,
        patch("taiga.projects.services.invitations_repositories", autospec=True) as fake_invitation_repositories,
        patch("taiga.projects.services.roles_repositories", autospec=True) as fake_roles_repositories,
        patch("taiga.projects.services.workspaces_repositories", autospec=True) as fake_workspaces_repositories,
    ):
        fake_permissions_services.get_user_project_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_workspace_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_permissions_for_project.return_value = (True, True, [])
        fake_workspaces_repositories.get_workspace_summary.return_value = workspace
        await services.get_project_detail(project=project, user=user)

        fake_permissions_services.get_user_project_role_info.assert_awaited_once()
        fake_permissions_services.get_user_workspace_role_info.assert_awaited_once()
        fake_permissions_services.get_user_permissions_for_project.assert_awaited_once()
        fake_workspaces_repositories.get_workspace_summary.assert_awaited_once()
        fake_invitation_repositories.has_pending_project_invitation_for_user.assert_awaited_once()
        fake_roles_repositories.user_is_project_member.assert_awaited_once()


async def test_get_project_detail_anonymous():
    anonymous_user = AnonymousUser()
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    permissions = ["add_task", "view_task", "modify_story", "view_story"]
    project = await (f.create_project(owner=user, workspace=workspace, public_permissions=permissions))

    with (
        patch("taiga.projects.services.permissions_services", autospec=True) as fake_permissions_services,
        patch("taiga.projects.services.invitations_repositories", autospec=True) as fake_invitation_repositories,
        patch("taiga.projects.services.roles_repositories", autospec=True) as fake_roles_repositories,
        patch("taiga.projects.services.workspaces_repositories", autospec=True) as fake_workspaces_repositories,
    ):
        fake_permissions_services.get_user_project_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_workspace_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_permissions_for_project.return_value = (True, True, [])
        fake_workspaces_repositories.get_workspace_summary.return_value = workspace
        await services.get_project_detail(project=project, user=anonymous_user)

        fake_permissions_services.get_user_project_role_info.assert_awaited_once()
        fake_permissions_services.get_user_workspace_role_info.assert_awaited_once()
        fake_permissions_services.get_user_permissions_for_project.assert_awaited_once()
        fake_workspaces_repositories.get_workspace_summary.assert_awaited_once()
        fake_invitation_repositories.has_pending_project_invitation_for_user.assert_not_awaited()
        fake_roles_repositories.user_is_project_member.assert_awaited_once()


##########################################################
# update_project_public_permissions
##########################################################


async def test_update_project_public_permissions_ok():
    project = await f.create_project()
    permissions = ["add_task", "view_task", "modify_story", "view_story"]

    with patch("taiga.projects.services.projects_repositories", autospec=True) as fake_project_repository:
        await services.update_project_public_permissions(project=project, permissions=permissions)
        fake_project_repository.update_project_public_permissions.assert_awaited_once_with(
            project=project, permissions=permissions
        )


async def test_update_project_public_permissions_not_valid():
    project = await f.create_project()
    not_valid_permissions = ["invalid_permission", "other_not_valid", "add_story"]

    with pytest.raises(ex.NotValidPermissionsSetError):
        await services.update_project_public_permissions(project=project, permissions=not_valid_permissions)


async def test_update_project_public_permissions_incompatible():
    project = await f.create_project()
    incompatible_permissions = ["view_task"]

    with pytest.raises(ex.IncompatiblePermissionsSetError):
        await services.update_project_public_permissions(project=project, permissions=incompatible_permissions)


##########################################################
# update_project_workspace_member_permissions
##########################################################


async def test_update_project_workspace_member_permissions_ok():
    workspace = await f.create_workspace(is_premium=True)
    project = await f.create_project(workspace=workspace)
    permissions = ["add_task", "view_task", "modify_story", "view_story"]

    with patch("taiga.projects.services.projects_repositories", autospec=True) as fake_project_repository:
        await services.update_project_workspace_member_permissions(project=project, permissions=permissions)
        fake_project_repository.update_project_workspace_member_permissions.assert_awaited_once_with(
            project=project, permissions=permissions
        )


async def test_update_project_workspace_member_permissions_not_valid():
    workspace = await f.create_workspace(is_premium=True)
    project = await f.create_project(workspace=workspace)
    not_valid_permissions = ["invalid_permission", "other_not_valid", "add_story"]

    with pytest.raises(ex.NotValidPermissionsSetError):
        await services.update_project_workspace_member_permissions(project=project, permissions=not_valid_permissions)


async def test_update_project_workspace_member_permissions_incompatible():
    workspace = await f.create_workspace(is_premium=True)
    project = await f.create_project(workspace=workspace)
    incompatible_permissions = ["view_task"]

    with pytest.raises(ex.IncompatiblePermissionsSetError):
        await services.update_project_workspace_member_permissions(
            project=project, permissions=incompatible_permissions
        )


async def test_update_project_workspace_member_permissions_not_premium():
    workspace = await f.create_workspace(is_premium=False)
    project = await f.create_project(workspace=workspace)
    incompatible_permissions = ["view_story"]

    with pytest.raises(ex.NotPremiumWorkspaceError):
        await services.update_project_workspace_member_permissions(
            project=project, permissions=incompatible_permissions
        )


##########################################################
# get_workspace_member_permissions
##########################################################


async def test_get_workspace_member_permissions_not_premium():
    workspace = await f.create_workspace(is_premium=False)
    project = await f.create_project(workspace=workspace)

    with pytest.raises(ex.NotPremiumWorkspaceError):
        await services.get_workspace_member_permissions(project=project)
