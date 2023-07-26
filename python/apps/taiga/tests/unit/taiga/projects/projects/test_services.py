# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import uuid
from unittest.mock import patch

import pytest
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects import services
from taiga.projects.projects.services import exceptions as ex
from taiga.users.models import AnonymousUser
from taiga.workspaces.workspaces.serializers.nested import WorkspaceNestedSerializer
from tests.utils import factories as f

pytestmark = pytest.mark.django_db

##########################################################
# create_project
##########################################################


async def test_create_project():
    workspace = f.build_workspace()

    with (
        patch("taiga.projects.projects.services._create_project") as fake_create_project,
        patch("taiga.projects.projects.services.get_project_detail") as fake_get_project_detail,
    ):
        await services.create_project(
            workspace=workspace, name="n", description="d", color=2, created_by=workspace.created_by
        )

        fake_create_project.assert_awaited_once()
        fake_get_project_detail.assert_awaited_once()


async def test_internal_create_project():
    workspace = f.build_workspace()

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_project_repository,
        patch("taiga.projects.projects.services.pj_roles_repositories", autospec=True) as fake_pj_role_repository,
        patch(
            "taiga.projects.projects.services.pj_memberships_repositories", autospec=True
        ) as fake_pj_memberships_repository,
    ):
        fake_project_repository.create_project.return_value = await f.create_project()

        await services.create_project(
            workspace=workspace, name="n", description="d", color=2, created_by=workspace.created_by
        )

        fake_project_repository.create_project.assert_awaited_once()
        fake_project_repository.get_project_template.assert_awaited_once()
        fake_pj_role_repository.get_project_role.assert_awaited_once()
        fake_pj_memberships_repository.create_project_membership.assert_awaited_once()


async def test_create_project_with_logo():
    workspace = f.build_workspace()
    project = f.build_project(workspace=workspace)
    role = f.build_project_role(project=project)

    logo = f.build_image_uploadfile()

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_project_repository,
        patch("taiga.projects.projects.services.pj_roles_repositories", autospec=True) as fake_pj_roles_repository,
        patch("taiga.projects.projects.services.pj_memberships_repositories", autospec=True),
    ):
        fake_project_repository.create_project.return_value = project
        fake_pj_roles_repository.get_project_role.return_value = role

        await services._create_project(
            workspace=workspace, name="n", description="d", color=2, created_by=workspace.created_by, logo=logo
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
        await services._create_project(
            workspace=workspace, name="n", description="d", color=2, created_by=workspace.created_by
        )

        fake_project_repository.create_project.assert_awaited_once_with(
            workspace=workspace, name="n", description="d", color=2, created_by=workspace.created_by, logo=None
        )


##########################################################
# list_workspace_projects_for_user
##########################################################


async def test_list_workspace_projects_for_a_ws_member():
    workspace = await f.create_workspace()

    with (patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_projects_repo,):
        await services.list_workspace_projects_for_user(workspace=workspace, user=workspace.created_by)
        fake_projects_repo.list_projects.assert_awaited_once_with(
            filters={"workspace_id": workspace.id},
            prefetch_related=["workspace"],
        )


async def test_list_workspace_projects_not_for_a_ws_member():
    workspace = f.build_workspace()
    user = f.build_user()

    with (patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_projects_repo,):
        await services.list_workspace_projects_for_user(workspace=workspace, user=user)
        fake_projects_repo.list_projects.assert_awaited_once_with(
            filters={"workspace_id": workspace.id, "project_member_id": user.id},
            prefetch_related=["workspace"],
        )


##########################################################
# get_workspace_invited_projects_for_user
##########################################################


async def test_list_workspace_invited_projects_for_user():
    workspace = f.build_workspace()

    with patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_projects_repo:
        await services.list_workspace_invited_projects_for_user(workspace=workspace, user=workspace.created_by)
        fake_projects_repo.list_projects.assert_awaited_once_with(
            filters={
                "workspace_id": workspace.id,
                "invitee_id": workspace.created_by.id,
                "invitation_status": ProjectInvitationStatus.PENDING,
            }
        )


##########################################################
# get_project_detail
##########################################################


async def test_get_project_detail():
    workspace = await f.create_workspace()
    project = f.build_project(created_by=workspace.created_by, workspace=workspace)

    with (
        patch("taiga.projects.projects.services.permissions_services", autospec=True) as fake_permissions_services,
        patch("taiga.projects.projects.services.workspaces_services", autospec=True) as fake_workspaces_services,
        patch(
            "taiga.projects.projects.services.pj_invitations_services", autospec=True
        ) as fake_pj_invitations_services,
    ):
        fake_permissions_services.get_user_project_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_permissions_for_project.return_value = []
        fake_permissions_services.is_workspace_member.return_value = True
        fake_pj_invitations_services.has_pending_project_invitation.return_value = True
        fake_workspaces_services.get_workspace_nested.return_value = WorkspaceNestedSerializer(
            id=uuid.uuid1(), name="ws 1", slug="ws-1", user_role="admin"
        )
        await services.get_project_detail(project=project, user=workspace.created_by)

        fake_permissions_services.get_user_project_role_info.assert_awaited_once_with(
            project=project, user=workspace.created_by
        )
        fake_permissions_services.get_user_permissions_for_project.assert_awaited_once_with(
            is_project_admin=True,
            is_workspace_member=True,
            is_project_member=True,
            is_authenticated=True,
            project_role_permissions=[],
            project=project,
        )
        fake_pj_invitations_services.has_pending_project_invitation.assert_awaited_once_with(
            user=workspace.created_by, project=project
        )
        fake_workspaces_services.get_workspace_nested.assert_awaited_once_with(
            id=workspace.id, user_id=workspace.created_by.id
        )


async def test_get_project_detail_anonymous():
    user = AnonymousUser()
    workspace = await f.create_workspace()
    permissions = ["modify_story", "view_story"]
    project = f.build_project(workspace=workspace, public_permissions=permissions)

    with (
        patch("taiga.projects.projects.services.permissions_services", autospec=True) as fake_permissions_services,
        patch("taiga.projects.projects.services.workspaces_services", autospec=True) as fake_workspaces_services,
        patch(
            "taiga.projects.projects.services.pj_invitations_services", autospec=True
        ) as fake_pj_invitations_services,
    ):
        fake_permissions_services.get_user_project_role_info.return_value = (True, True, [])
        fake_permissions_services.get_user_permissions_for_project.return_value = []
        fake_permissions_services.is_workspace_member.return_value = True
        fake_pj_invitations_services.has_pending_project_invitation.return_value = False
        fake_workspaces_services.get_workspace_nested.return_value = WorkspaceNestedSerializer(
            id=uuid.uuid1(), name="ws 1", slug="ws-1", user_role="admin"
        )
        await services.get_project_detail(project=project, user=user)

        fake_permissions_services.get_user_project_role_info.assert_awaited_once_with(project=project, user=user)
        fake_permissions_services.get_user_permissions_for_project.assert_awaited_once_with(
            is_project_admin=True,
            is_workspace_member=True,
            is_project_member=True,
            is_authenticated=False,
            project_role_permissions=[],
            project=project,
        )
        fake_pj_invitations_services.has_pending_project_invitation.assert_not_awaited()
        fake_workspaces_services.get_workspace_nested.assert_awaited_once_with(id=workspace.id, user_id=user.id)


##########################################################
# update_project
##########################################################


async def test_update_project_ok(tqmanager):
    project = f.build_project()
    values = {"name": "new name", "description": ""}

    with patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_pj_repo:
        await services._update_project(project=project, values=values)
        fake_pj_repo.update_project.assert_awaited_once_with(project=project, values=values)
        assert len(tqmanager.pending_jobs) == 0


async def test_update_project_ok_with_new_logo(tqmanager):
    new_logo = f.build_image_uploadfile()
    project = f.build_project()
    values = {"name": "new name", "description": "", "logo": new_logo}

    with patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_pj_repo:
        await services._update_project(project=project, values=values)
        fake_pj_repo.update_project.assert_awaited_once_with(project=project, values=values)
        assert len(tqmanager.pending_jobs) == 0


async def test_update_project_ok_with_logo_replacement(tqmanager):
    logo = f.build_image_file()
    new_logo = f.build_image_uploadfile(name="new_logo")
    project = f.build_project(logo=logo)
    values = {"name": "new name", "description": "", "logo": new_logo}

    with patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_pj_repo:
        await services._update_project(project=project, values=values)
        fake_pj_repo.update_project.assert_awaited_once_with(project=project, values=values)
        assert len(tqmanager.pending_jobs) == 1
        job = tqmanager.pending_jobs[0]
        assert "delete_old_logo" in job["task_name"]
        assert "path" in job["args"]
        assert job["args"]["path"].endswith(logo.name)


async def test_update_project_name_empty(tqmanager):
    project = f.build_project()
    logo = f.build_image_file()
    values = {"name": "", "description": "", "logo": logo}

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_pj_repo,
        pytest.raises(ex.TaigaValidationError),
    ):
        await services._update_project(project=project, values=values)
        fake_pj_repo.update_project.assert_not_awaited()
        assert len(tqmanager.pending_jobs) == 0


##########################################################
# update_project_public_permissions
##########################################################


async def test_update_project_public_permissions_ok():
    project = f.build_project()
    permissions = ["modify_story", "view_story"]

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
# delete_project
##########################################################


async def test_delete_project_fail():
    user = f.build_user()
    project = f.build_project()

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_projects_repo,
        patch("taiga.projects.projects.services.projects_events", autospec=True) as fake_projects_events,
        patch("taiga.projects.projects.services.users_services", autospec=True) as fake_users_services,
    ):
        fake_projects_repo.delete_projects.return_value = 0
        fake_users_services.list_guests_in_workspace_for_project.return_value = []

        await services.delete_project(project=project, deleted_by=user)

        fake_projects_events.emit_event_when_project_is_deleted.assert_not_awaited()
        fake_projects_repo.delete_projects.assert_awaited_once_with(
            filters={"id": project.id},
        )


async def test_delete_project_ok(tqmanager):
    user = f.build_user()
    logo = f.build_image_file()
    project = f.build_project(logo=logo)

    with (
        patch("taiga.projects.projects.services.projects_repositories", autospec=True) as fake_projects_repo,
        patch("taiga.projects.projects.services.projects_events", autospec=True) as fake_projects_events,
        patch("taiga.projects.projects.services.users_services", autospec=True) as fake_users_services,
    ):
        fake_projects_repo.delete_projects.return_value = 1
        fake_users_services.list_guests_in_workspace_for_project.return_value = []

        await services.delete_project(project=project, deleted_by=user)
        fake_projects_events.emit_event_when_project_is_deleted.assert_awaited_once_with(
            workspace=project.workspace, project=project, deleted_by=user, guests=[]
        )
        fake_projects_repo.delete_projects.assert_awaited_once_with(
            filters={"id": project.id},
        )
        assert len(tqmanager.pending_jobs) == 1
        job = tqmanager.pending_jobs[0]
        assert "delete_old_logo" in job["task_name"]
        assert "path" in job["args"]
        assert job["args"]["path"].endswith(logo.name)
