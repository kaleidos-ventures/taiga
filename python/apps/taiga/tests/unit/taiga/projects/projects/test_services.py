# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi import UploadFile
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects import services
from taiga.projects.projects.services import exceptions as ex
from taiga.users.models import AnonymousUser
from taiga.workspaces.workspaces.serializers.nested import WorkspaceNestedSerializer
from tests.utils import factories as f
from tests.utils.images import valid_image_upload_file

pytestmark = pytest.mark.django_db


##########################################################
# create_project
##########################################################


async def test_create_project():
    workspace = f.build_workspace()

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_project_repository,
        patch("taiga.projects.projects.services.pj_roles_repositories", autospec=True) as fake_pj_role_repository,
        patch(
            "taiga.projects.projects.services.pj_memberships_repositories", autospec=True
        ) as fake_pj_memberships_repository,
    ):
        fake_project_repository.create_project.return_value = await f.create_project()

        await services.create_project(workspace=workspace, name="n", description="d", color=2, owner=workspace.owner)

        fake_project_repository.create_project.assert_awaited_once()
        fake_project_repository.get_project_template.assert_awaited_once()
        fake_pj_role_repository.get_project_role.assert_awaited_once()
        fake_pj_memberships_repository.create_project_membership.assert_awaited_once()


async def test_create_project_with_logo():
    workspace = f.build_workspace()
    project = f.build_project(workspace=workspace)
    role = f.build_project_role(project=project)

    logo: UploadFile = valid_image_upload_file

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_project_repository,
        patch("taiga.projects.projects.services.pj_roles_repositories", autospec=True) as fake_pj_roles_repository,
        patch("taiga.projects.projects.services.pj_memberships_repositories", autospec=True),
    ):
        fake_project_repository.create_project.return_value = project
        fake_pj_roles_repository.get_project_role.return_value = role

        await services.create_project(
            workspace=workspace, name="n", description="d", color=2, owner=workspace.owner, logo=logo
        )

        service_file_param = fake_project_repository.create_project.call_args_list[0][1]
        assert service_file_param["logo"].name == logo.filename
        assert service_file_param["logo"].file == logo.file


async def test_create_project_with_no_logo():
    workspace = f.build_workspace()

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_project_repository,
        patch("taiga.projects.projects.services.pj_roles_repositories", autospec=True),
        patch("taiga.projects.projects.services.pj_memberships_repositories", autospec=True),
    ):
        fake_project_repository.create_project.return_value = await f.create_project()
        await services.create_project(workspace=workspace, name="n", description="d", color=2, owner=workspace.owner)

        fake_project_repository.create_project.assert_awaited_once_with(
            workspace=workspace, name="n", description="d", color=2, owner=workspace.owner, logo=None
        )


##########################################################
# list_workspace_projects_for_user
##########################################################


async def test_list_workspace_projects_for_user_admin():
    user = f.build_user()
    workspace = f.build_workspace(owner=user)

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_projects_repo,
        patch("taiga.projects.projects.services.ws_roles_repositories", autospec=True) as fake_ws_roles_repo,
    ):
        fake_ws_roles_repo.get_workspace_role.return_value = MagicMock(is_admin=True)
        await services.list_workspace_projects_for_user(workspace=workspace, user=user)
        fake_projects_repo.list_projects.assert_awaited_once_with(
            filters={"workspace_id": workspace.id},
            prefetch_related=["workspace"],
        )


async def test_list_workspace_projects_for_user_member():
    user = f.build_user()
    workspace = f.build_workspace(owner=user)

    with (
        patch("taiga.projects.projects.services.ws_roles_repositories", autospec=True) as fake_ws_roles_repo,
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_projects_repo,
    ):
        fake_ws_roles_repo.get_workspace_role.return_value = MagicMock(is_admin=False)
        await services.list_workspace_projects_for_user(workspace=workspace, user=user)
        fake_projects_repo.list_projects.assert_awaited_once_with(
            filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user.id},
            prefetch_related=["workspace"],
        )


##########################################################
# get_workspace_invited_projects_for_user
##########################################################


async def test_list_workspace_invited_projects_for_user():
    user = f.build_user()
    workspace = f.build_workspace(owner=user)

    with patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_projects_repo:
        await services.list_workspace_invited_projects_for_user(workspace=workspace, user=user)
        fake_projects_repo.list_projects.assert_awaited_once_with(
            filters={
                "workspace_id": workspace.id,
                "invitee_id": user.id,
                "invitation_status": ProjectInvitationStatus.PENDING,
            }
        )


##########################################################
# list_workspace_member_permissions
##########################################################


async def test_list_workspace_member_permissions_not_premium():
    workspace = f.build_workspace(is_premium=False)
    project = f.build_project(workspace=workspace)

    with pytest.raises(ex.NotPremiumWorkspaceError):
        await services.list_workspace_member_permissions(project=project)


##########################################################
# get_project_detail
##########################################################


async def test_get_project_detail():
    user = f.build_user()
    workspace = f.build_workspace(owner=user)
    project = f.build_project(owner=user, workspace=workspace)

    with (
        patch("taiga.projects.projects.services.permissions_services", autospec=True) as fake_permissions_services,
        patch("taiga.projects.projects.services.workspaces_services", autospec=True) as fake_workspaces_services,
    ):
        fake_permissions_services.get_user_project_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_workspace_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_permissions_for_project.return_value = []
        fake_permissions_services.has_pending_project_invitation.return_value = True
        fake_workspaces_services.get_workspace_nested.return_value = WorkspaceNestedSerializer(
            id=uuid.uuid1(), name="ws 1", slug="ws-1", user_role="admin", is_premium=True
        )
        await services.get_project_detail(project=project, user=user)

        fake_permissions_services.get_user_project_role_info.assert_awaited_once_with(project=project, user=user)
        fake_permissions_services.get_user_workspace_role_info.assert_awaited_once_with(user=user, workspace=workspace)
        fake_permissions_services.get_user_permissions_for_project.assert_awaited_once_with(
            is_authenticated=True,
            is_project_admin=True,
            is_workspace_admin=True,
            is_project_member=True,
            is_workspace_member=True,
            project_role_permissions=[],
            project=project,
        )
        fake_permissions_services.has_pending_project_invitation.assert_awaited_once_with(user=user, project=project)
        fake_workspaces_services.get_workspace_nested.assert_awaited_once_with(id=workspace.id, user_id=user.id)


async def test_get_project_detail_anonymous():
    user = AnonymousUser()
    workspace = f.build_workspace()
    permissions = ["add_task", "view_task", "modify_story", "view_story"]
    project = f.build_project(workspace=workspace, public_permissions=permissions)

    with (
        patch("taiga.projects.projects.services.permissions_services", autospec=True) as fake_permissions_services,
        patch("taiga.projects.projects.services.workspaces_services", autospec=True) as fake_workspaces_services,
    ):
        fake_permissions_services.get_user_project_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_workspace_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_permissions_for_project.return_value = []
        fake_permissions_services.has_pending_project_invitation.return_value = False
        fake_workspaces_services.get_workspace_nested.return_value = WorkspaceNestedSerializer(
            id=uuid.uuid1(), name="ws 1", slug="ws-1", user_role="admin", is_premium=True
        )
        await services.get_project_detail(project=project, user=user)

        fake_permissions_services.get_user_project_role_info.assert_awaited_once_with(project=project, user=user)
        fake_permissions_services.get_user_workspace_role_info.assert_awaited_once_with(user=user, workspace=workspace)
        fake_permissions_services.get_user_permissions_for_project.assert_awaited_once_with(
            is_authenticated=False,
            is_project_admin=True,
            is_workspace_admin=True,
            is_project_member=True,
            is_workspace_member=True,
            project_role_permissions=[],
            project=project,
        )
        fake_permissions_services.has_pending_project_invitation.assert_not_awaited()
        fake_workspaces_services.get_workspace_nested.assert_awaited_once_with(id=workspace.id, user_id=user.id)


##########################################################
# update_project
##########################################################


async def test_update_project_ok(tqmanager):
    project = f.build_project()
    values = {"name": "new name", "description": ""}

    with patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_pj_repo:
        await services.update_project(project=project, values=values)
        fake_pj_repo.update_project.assert_awaited_once_with(project=project, values=values)
        assert len(tqmanager.pending_jobs) == 0


async def test_update_project_ok_with_logo(tqmanager):
    project = f.build_project()
    values = {"name": "new name", "description": "", "logo": valid_image_upload_file}

    with patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_pj_repo:
        await services.update_project(project=project, values=values)
        fake_pj_repo.update_project.assert_awaited_once_with(project=project, values=values)
        assert len(tqmanager.pending_jobs) == 1
        job = tqmanager.pending_jobs[0]
        assert "delete_old_logo" in job["task_name"]
        assert "path" in job["args"]
        assert valid_image_upload_file.filename in job["args"]["path"]


async def test_update_project_name_empty(tqmanager):
    project = f.build_project()
    values = {"name": "", "description": "", "logo": valid_image_upload_file}

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_pj_repo,
        pytest.raises(ex.TaigaValidationError),
    ):
        await services.update_project(project=project, values=values)
        fake_pj_repo.update_project.assert_not_awaited()
        assert len(tqmanager.pending_jobs) == 0


##########################################################
# update_project_public_permissions
##########################################################


async def test_update_project_public_permissions_ok():
    project = f.build_project()
    permissions = ["add_task", "view_task", "modify_story", "view_story"]

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_project_repository,
        patch("taiga.projects.projects.services.projects_events", autospec=True) as fake_projects_events,
    ):
        await services.update_project_public_permissions(project=project, permissions=permissions)
        fake_project_repository.update_project.assert_awaited_once_with(
            project=project, values={"public_permissions": permissions}
        )
        fake_projects_events.emit_event_when_project_permissions_are_updated.assert_awaited_with(project=project)


##########################################################
# update_project_workspace_member_permissions
##########################################################


async def test_update_project_workspace_member_permissions_ok():
    workspace = f.build_workspace(is_premium=True)
    project = f.build_project(workspace=workspace)
    permissions = ["add_task", "view_task", "modify_story", "view_story"]

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_project_repository,
        patch("taiga.projects.projects.services.projects_events", autospec=True) as fake_projects_events,
    ):
        await services.update_project_workspace_member_permissions(project=project, permissions=permissions)
        fake_project_repository.update_project.assert_awaited_once_with(
            project=project, values={"workspace_member_permissions": permissions}
        )
        fake_projects_events.emit_event_when_project_permissions_are_updated.assert_awaited_with(project=project)


async def test_update_project_workspace_member_permissions_not_premium():
    workspace = f.build_workspace(is_premium=False)
    project = f.build_project(workspace=workspace)
    incompatible_permissions = ["view_story"]

    with (
        patch("taiga.projects.projects.services.projects_events", autospec=True) as fake_projects_events,
        pytest.raises(ex.NotPremiumWorkspaceError),
    ):
        await services.update_project_workspace_member_permissions(
            project=project, permissions=incompatible_permissions
        )
        fake_projects_events.emit_event_when_project_permissions_are_updated.assert_not_awaited()
