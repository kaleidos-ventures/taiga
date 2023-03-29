# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import uuid1

import pytest
from asgiref.sync import sync_to_async
from django.core.files import File
from taiga.base.db import models
from taiga.base.db import sequences as seq
from taiga.projects import references
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects import repositories
from taiga.projects.projects.models import Project
from taiga.projects.roles.models import ProjectRole
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_project
##########################################################


async def test_create_project():
    workspace = await f.create_workspace()
    project = await repositories.create_project(
        name="My test project", description="", color=3, created_by=workspace.created_by, workspace=workspace
    )
    assert project.slug == "my-test-project"
    assert await _seq_exists(references.get_project_references_seqname(project.id))


async def test_create_project_with_non_ASCI_chars():
    workspace = await f.create_workspace()
    project = await repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, created_by=workspace.created_by, workspace=workspace
    )
    assert project.slug == "my-proj-hu-shect"
    assert await _seq_exists(references.get_project_references_seqname(project.id))


async def test_create_project_with_logo():
    image_file = f.build_image_file()
    workspace = await f.create_workspace()
    project = await repositories.create_project(
        name="My test project",
        description="",
        color=3,
        created_by=workspace.created_by,
        workspace=workspace,
        logo=image_file,
    )
    assert project.logo.name.endswith(image_file.name)
    assert await _seq_exists(references.get_project_references_seqname(project.id))


async def test_create_project_with_no_logo():
    workspace = await f.create_workspace()
    project = await repositories.create_project(
        name="My test project",
        description="",
        color=3,
        created_by=workspace.created_by,
        workspace=workspace,
        logo=None,
    )
    assert project.logo == File(None)
    assert await _seq_exists(references.get_project_references_seqname(project.id))


##########################################################
# list projects
##########################################################


async def test_list_workspace_invited_projects_for_user():
    user8 = await f.create_user()
    user9 = await f.create_user()

    # workspace, user8(ws-admin), user9(ws-member)
    workspace = await f.create_workspace(created_by=user8)
    await f.create_workspace_membership(user=user9, workspace=workspace)
    # user8 is a pj-admin of several projects
    pj1 = await f.create_project(workspace=workspace, created_by=user8)
    await f.create_project(workspace=workspace, created_by=user8)
    pj3 = await f.create_project(workspace=workspace, created_by=user8)
    # user8 invites user9 to several projects
    await f.create_project_invitation(email=user9.email, user=user9, project=pj1, invited_by=user8)
    await f.create_project_invitation(email=user9.email, user=user9, project=pj3, invited_by=user8)

    res = await repositories.list_projects(
        filters={
            "workspace_id": workspace.id,
            "invitee_id": user9.id,
            "invitation_status": ProjectInvitationStatus.PENDING,
        },
    )
    assert len(res) == 2
    assert res[0].name == pj3.name
    assert res[1].name == pj1.name


async def test_list_projects():
    workspace = await f.create_workspace()
    await f.create_project(workspace=workspace, created_by=workspace.created_by)
    await f.create_project(workspace=workspace, created_by=workspace.created_by)
    await f.create_project(workspace=workspace, created_by=workspace.created_by)
    res = await repositories.list_projects(filters={"workspace_id": workspace.id})
    assert len(res) == 3


async def test_list_workspace_projects_for_user_1():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace, user6(ws-member)
    workspace = await f.create_workspace(created_by=user6)
    # user7 is a pj-admin
    await f.create_project(workspace=workspace, created_by=user7)
    # user7 is pj-member
    pj11 = await f.create_project(workspace=workspace, created_by=user6)
    pj_general_role = await _get_pj_member_role(project=pj11)
    await f.create_project_membership(user=user7, project=pj11, role=pj_general_role)
    # user7 is not a pj-member
    pj14 = await f.create_project(workspace=workspace, created_by=user6)
    await _save_project(project=pj14)

    # A ws-member should see every project in her workspaces
    res = await repositories.list_projects(filters={"workspace_id": workspace.id})
    assert len(res) == 3
    # Not ws-member users should see just the projects in which she's a pj-member
    res = await repositories.list_projects(filters={"workspace_id": workspace.id, "project_member_id": user7.id})
    assert len(res) == 2


async def test_list_projects_2():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace, user6(ws-admin), user7(ws-member, has_projects: true)
    workspace = await f.create_workspace(created_by=user6)
    await f.create_workspace_membership(user=user7, workspace=workspace)
    # user7 is not a pj-member and ws-members are not allowed
    await f.create_project(workspace=workspace, created_by=user6)

    res = await repositories.list_projects(filters={"workspace_id": workspace.id, "project_member_id": user6.id})
    assert len(res) == 1
    res = await repositories.list_projects(filters={"workspace_id": workspace.id, "project_member_id": user7.id})
    assert len(res) == 0


async def test_list_workspace_projects_for_user_3():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace, user6(ws-admin), user7(ws-member, has_projects: false)
    workspace = await f.create_workspace(created_by=user6)
    await f.create_workspace_membership(user=user7, workspace=workspace)

    res = await repositories.list_projects(filters={"workspace_id": workspace.id, "project_member_id": user6.id})
    assert len(res) == 0
    res = await repositories.list_projects(filters={"workspace_id": workspace.id, "project_member_id": user7.id})
    assert len(res) == 0


async def test_list_workspace_projects_for_user_4():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace, user6(ws-admin), user7(no ws-member, ws-members have permissions)
    workspace = await f.create_workspace(created_by=user6)
    # user7 is not a pj-member or ws-member but ws-members are allowed
    await f.create_project(workspace=workspace, created_by=user6)

    res = await repositories.list_projects(filters={"workspace_id": workspace.id, "project_member_id": user6.id})
    assert len(res) == 1
    res = await repositories.list_projects(filters={"workspace_id": workspace.id, "project_member_id": user7.id})
    assert len(res) == 0


##########################################################
# get_project
##########################################################


async def test_get_project_return_project():
    project = await f.create_project(name="Project 1")
    assert await repositories.get_project(filters={"id": project.id}) == project


async def test_get_project_return_none():
    non_existent_id = uuid1()
    assert await repositories.get_project(filters={"id": non_existent_id}) is None


##########################################################
# update project
##########################################################


async def test_update_project():
    project = await f.create_project(name="Project 1")
    assert project.name == "Project 1"
    updated_project = await repositories.update_project(
        project=project,
        values={"name": "New name", "description": "New description"},
    )
    assert updated_project.name == "New name"
    assert updated_project.description == "New description"


async def test_update_project_delete_description():
    project = await f.create_project(name="Project 1")
    assert project.name == "Project 1"
    updated_project = await repositories.update_project(
        project,
        values={"description": None},
    )
    assert updated_project.description is None


async def test_update_project_delete_logo():
    project = await f.create_project(name="Project 1")
    assert project.logo is not None
    updated_project = await repositories.update_project(
        project,
        values={"logo": None},
    )
    assert updated_project.logo == models.FileField(None)


async def test_update_project_public_permissions():
    project = await f.create_project(name="Project 1")
    await repositories.update_project(
        project,
        values={"public_permissions": ["add_story", "view_story"]},
    )
    assert len(project.public_permissions) == 2
    assert len(project.anon_permissions) == 1


##########################################################
# delete_projects
##########################################################


async def test_delete_projects():
    project = await f.create_project()
    await f.create_project_invitation(project=project)
    seqname = references.get_project_references_seqname(project.id)

    assert await _seq_exists(seqname)
    deleted = await repositories.delete_projects(filters={"id": project.id})
    assert deleted == 10  # 1 project, 1 workflow, 4 statuses, 1 invitation, 1 membership, 2 roles
    assert not await _seq_exists(seqname)


##########################################################
# misc - get_total_projects
##########################################################


async def test_get_total_projects_in_ws_for_admin() -> None:
    user1 = await f.create_user()
    other_user = await f.create_user()
    ws = await f.create_workspace(created_by=user1)
    await f.create_project(workspace=ws, created_by=other_user)
    await f.create_project(workspace=ws, created_by=user1)

    res = await repositories.get_total_projects(filters={"workspace_id": ws.id})
    assert res == 2


async def test_get_total_projects_in_ws_for_member() -> None:
    admin = await f.create_user()
    user1 = await f.create_user()

    ws = await f.create_workspace(created_by=admin)
    await f.create_workspace_membership(user=user1, workspace=ws)

    # user1 is not a pj-member
    pj1 = await f.create_project(workspace=ws, created_by=admin)
    await _save_project(project=pj1)

    res = await repositories.get_total_projects(filters={"project_member_id": user1.id, "workspace_id": ws.id})
    # Not ws-admin users should see just the projects in which she's a pj-member
    assert res == 0


async def test_get_total_projects_in_ws_for_guest() -> None:
    admin = await f.create_user()
    user1 = await f.create_user()
    ws = await f.create_workspace(created_by=admin)

    pj1 = await f.create_project(workspace=ws, created_by=admin)
    pj_general_role = await _get_pj_member_role(project=pj1)
    await f.create_project_membership(user=user1, project=pj1, role=pj_general_role)

    pj2 = await f.create_project(workspace=ws, created_by=admin)
    pj_general_role = await _get_pj_member_role(project=pj2)
    await f.create_project_membership(user=user1, project=pj2, role=pj_general_role)

    res = await repositories.get_total_projects(filters={"project_member_id": user1.id, "workspace_id": ws.id})
    assert res == 2


##########################################################
# Template: get_template
##########################################################


async def test_get_template_return_template():
    assert await repositories.get_project_template(filters={"slug": "kanban"}) is not None


##########################################################
# utils
##########################################################


@sync_to_async
def _get_pj_member_role(project: Project) -> ProjectRole:
    return project.roles.get(slug="general")


@sync_to_async
def _save_project(project: Project) -> Project:
    return project.save()


@sync_to_async
def _save_role(role: ProjectRole) -> ProjectRole:
    return role.save()


_seq_exists = sync_to_async(seq.exists)
