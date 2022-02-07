# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import UploadFile
from taiga.exceptions import services as ex
from taiga.projects import services
from tests.utils import factories as f
from tests.utils.images import valid_image_upload_file

pytestmark = pytest.mark.django_db


##########################################################
# create_project
##########################################################


async def test_create_project():
    workspace = await f.create_workspace()

    with patch("taiga.projects.services.projects_repo", new_callable=AsyncMock) as fake_project_repository, patch(
        "taiga.projects.services.roles_repo", new_callable=AsyncMock
    ) as fake_role_repository:
        fake_project_repository.create_project.return_value = await f.create_project()

        await services.create_project(workspace=workspace, name="n", description="d", color=2, owner=workspace.owner)

        fake_project_repository.create_project.assert_awaited_once()
        fake_project_repository.get_template.assert_awaited_once()
        fake_role_repository.get_project_role.assert_awaited_once()
        fake_role_repository.create_membership.assert_awaited_once()


async def test_create_project_with_logo():
    template = await f.create_project_template()
    workspace = await f.create_workspace()
    project = await f.create_project(workspace=workspace)
    role = await f.create_role(project=project)
    logo: UploadFile = valid_image_upload_file

    with patch("taiga.projects.services.projects_repo", new_callable=AsyncMock) as fake_project_repository, patch(
        "taiga.projects.services.roles_repo", new_callable=AsyncMock
    ) as fake_roles_repository:
        fake_project_repository.get_template.return_value = template
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

    with patch("taiga.projects.services.projects_repo", new_callable=AsyncMock) as fake_project_repository, patch(
        "taiga.projects.services.roles_repo", new_callable=AsyncMock
    ):
        fake_project_repository.create_project.return_value = await f.create_project()
        template = await f.create_project_template()
        fake_project_repository.get_template.return_value = template
        await services.create_project(workspace=workspace, name="n", description="d", color=2, owner=workspace.owner)

        fake_project_repository.create_project.assert_awaited_once_with(
            workspace=workspace, name="n", description="d", color=2, owner=workspace.owner, logo=None, template=template
        )


##########################################################
# update_project_public_permissions
##########################################################


async def test_update_project_public_permissions_ok():
    project = await f.create_project()
    permissions = ["view_project", "view_milestones", "add_us", "view_us", "modify_task", "view_tasks"]
    anon_permissions = ["view_project", "view_milestones", "view_us", "view_tasks"]

    with patch("taiga.projects.services.projects_repo", new_callable=AsyncMock) as fake_project_repository:
        await services.update_project_public_permissions(project=project, permissions=permissions)
        fake_project_repository.update_project_public_permissions.assert_awaited_once_with(
            project=project, permissions=permissions, anon_permissions=anon_permissions
        )


async def test_update_project_public_permissions_not_valid():
    project = await f.create_project()
    not_valid_permissions = ["invalid_permission", "other_not_valid", "add_us"]

    with pytest.raises(ex.NotValidPermissionsSetError):
        await services.update_project_public_permissions(project=project, permissions=not_valid_permissions)


async def test_update_project_public_permissions_incompatible():
    project = await f.create_project()
    incompatible_permissions = ["view_tasks", "view_milestones"]

    with pytest.raises(ex.IncompatiblePermissionsSetError):
        await services.update_project_public_permissions(project=project, permissions=incompatible_permissions)


##########################################################
# get_workspace_projects_for_user
##########################################################


async def test_get_workspace_projects_for_user_admin():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    with patch("taiga.projects.services.roles_repo", new_callable=AsyncMock) as fake_roles_repo, patch(
        "taiga.projects.services.projects_repo", new_callable=AsyncMock
    ) as fake_projects_repo:
        fake_roles_repo.is_workspace_admin.return_value = True
        await services.get_workspace_projects_for_user(workspace=workspace, user=user)
        fake_projects_repo.get_projects.assert_awaited_once_with(workspace_slug=workspace.slug)


async def test_get_workspace_projects_for_user_member():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    with patch("taiga.projects.services.roles_repo", new_callable=AsyncMock) as fake_roles_repo, patch(
        "taiga.projects.services.projects_repo", new_callable=AsyncMock
    ) as fake_projects_repo:
        fake_roles_repo.is_workspace_admin.return_value = False
        await services.get_workspace_projects_for_user(workspace=workspace, user=user)
        fake_projects_repo.get_workspace_projects_for_user.assert_awaited_once_with(
            workspace_id=workspace.id, user_id=user.id
        )


##########################################################
# update_project_workspace_member_permissions
##########################################################


async def test_update_project_workspace_member_permissions_ok():
    workspace = await f.create_workspace(is_premium=True)
    project = await f.create_project(workspace=workspace)
    permissions = ["view_project", "view_milestones", "add_us", "view_us", "modify_task", "view_tasks"]

    with patch("taiga.projects.services.projects_repo", new_callable=AsyncMock) as fake_project_repository:
        await services.update_project_workspace_member_permissions(project=project, permissions=permissions)
        fake_project_repository.update_project_workspace_member_permissions.assert_awaited_once_with(
            project=project, permissions=permissions
        )


async def test_update_project_workspace_member_permissions_not_valid():
    workspace = await f.create_workspace(is_premium=True)
    project = await f.create_project(workspace=workspace)
    not_valid_permissions = ["invalid_permission", "other_not_valid", "add_us"]

    with pytest.raises(ex.NotValidPermissionsSetError):
        await services.update_project_workspace_member_permissions(project=project, permissions=not_valid_permissions)


async def test_update_project_workspace_member_permissions_incompatible():
    workspace = await f.create_workspace(is_premium=True)
    project = await f.create_project(workspace=workspace)
    incompatible_permissions = ["view_tasks", "view_milestones"]

    with pytest.raises(ex.IncompatiblePermissionsSetError):
        await services.update_project_workspace_member_permissions(
            project=project, permissions=incompatible_permissions
        )


async def test_update_project_workspace_member_permissions_not_premium():
    workspace = await f.create_workspace(is_premium=False)
    project = await f.create_project(workspace=workspace)
    incompatible_permissions = ["view_us", "view_milestones"]

    with pytest.raises(ex.NotPremiumWorkspaceError):
        await services.update_project_workspace_member_permissions(
            project=project, permissions=incompatible_permissions
        )


##########################################################
# get_project_workspace_member_permissions
##########################################################


async def test_get_workspace_member_permissions_not_premium():
    workspace = await f.create_workspace(is_premium=False)
    project = await f.create_project(workspace=workspace)

    with pytest.raises(ex.NotPremiumWorkspaceError):
        await services.get_workspace_member_permissions(project=project)
