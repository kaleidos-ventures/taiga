# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import uuid1

import pytest
from asgiref.sync import sync_to_async
from django.core.files import File
from taiga.base.db import sequences as seq
from taiga.projects import references
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects import repositories
from taiga.projects.projects.models import Project
from taiga.projects.roles.models import ProjectRole
from taiga.workspaces.roles.models import WorkspaceRole
from taiga.workspaces.workspaces.models import Workspace
from tests.utils import factories as f
from tests.utils.images import valid_image_f

pytestmark = pytest.mark.django_db


##########################################################
# utils
##########################################################


@sync_to_async
def _get_ws_member_role(workspace: Workspace) -> WorkspaceRole:
    return workspace.roles.exclude(is_admin=True).first()


@sync_to_async
def _get_pj_member_role(project: Project) -> ProjectRole:
    return project.roles.get(slug="general")


@sync_to_async
def _save_project(project: Project) -> Project:
    return project.save()


@sync_to_async
def _delete_project(project: Project) -> Project:
    return project.delete()


@sync_to_async
def _save_role(role: ProjectRole) -> ProjectRole:
    return role.save()


_seq_exists = sync_to_async(seq.exists)


##########################################################
# get_project
##########################################################


async def test_get_projects():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    await f.create_project(workspace=workspace, owner=user)
    await f.create_project(workspace=workspace, owner=user)
    await f.create_project(workspace=workspace, owner=user)
    res = await repositories.get_projects(filters={"workspace_id": workspace.id})
    assert len(res) == 3


##########################################################
# create_project
##########################################################


async def test_create_project():
    workspace = await f.create_workspace()
    project = await repositories.create_project(
        name="My test project", description="", color=3, owner=workspace.owner, workspace=workspace
    )
    assert project.slug == "my-test-project"
    assert await _seq_exists(references.get_project_references_seqname(project.id))


async def test_create_project_with_non_ASCI_chars():
    workspace = await f.create_workspace()
    project = await repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=workspace.owner, workspace=workspace
    )
    assert project.slug == "my-proj-hu-shect"
    assert await _seq_exists(references.get_project_references_seqname(project.id))


async def test_create_project_with_logo():
    workspace = await f.create_workspace()
    project = await repositories.create_project(
        name="My proj#%&乕شect",
        description="",
        color=3,
        owner=workspace.owner,
        workspace=workspace,
        logo=valid_image_f,
    )
    assert valid_image_f.name in project.logo.name
    assert await _seq_exists(references.get_project_references_seqname(project.id))


async def test_create_project_with_no_logo():
    workspace = await f.create_workspace()
    project = await repositories.create_project(
        name="My proj#%&乕شect",
        description="",
        color=3,
        owner=workspace.owner,
        workspace=workspace,
        logo=None,
    )
    assert project.logo == File(None)
    assert await _seq_exists(references.get_project_references_seqname(project.id))


##########################################################
# delete_project
##########################################################

# NOTE: this functiomn does not yet exist, but we need to tests sequencie deletions


async def test_delete_project():
    workspace = await f.create_workspace()
    project = await repositories.create_project(
        name="My test project", description="", color=3, owner=workspace.owner, workspace=workspace
    )
    seqname = references.get_project_references_seqname(project.id)

    assert await _seq_exists(seqname)
    await _delete_project(project)
    assert not await _seq_exists(seqname)


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
# get_template
##########################################################


async def test_get_template_return_template():
    assert await repositories.get_project_template(filters={"slug": "kanban"}) is not None


##########################################################
# update_project_public_permissions
##########################################################


async def test_update_project_public_permissions():
    project = await f.create_project(name="Project 1")
    project.public_permissions = ["add_story", "view_story", "add_task", "view_task"]
    await repositories.update_project(project)
    assert len(project.public_permissions) == 4
    assert len(project.anon_permissions) == 2


##########################################################
# update_workspace_member_permissions
##########################################################


async def test_update_project_workspace_member_permissions():
    project = await f.create_project(name="Project 1")
    project.workspace_member_permissions = ["add_story", "view_story", "add_task", "view_task"]
    await repositories.update_project(project)
    assert len(project.workspace_member_permissions) == 4


##########################################################
# get_workspace_projects_for_user
##########################################################


async def test_get_workspace_projects_for_user_1():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace premium, user6(ws-admin), user7(ws-member)
    workspace = await f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user7, workspace=workspace, role=ws_member_role)
    # user7 is a pj-owner
    await f.create_project(workspace=workspace, owner=user7)
    # user7 is pj-member
    pj11 = await f.create_project(workspace=workspace, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj11)
    await f.create_project_membership(user=user7, project=pj11, role=pj_general_role)
    # user7 is pj-member, ws-members have permissions
    pj12 = await f.create_project(workspace=workspace, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj12)
    await f.create_project_membership(user=user7, project=pj12, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(pj_general_role)
    pj12.workspace_member_permissions = ["view_task"]
    await _save_project(project=pj12)
    # user7 is pj-member, ws-members don't have permissions
    pj13 = await f.create_project(workspace=workspace, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj13)
    await f.create_project_membership(user=user7, project=pj13, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(pj_general_role)
    # user7 is not a pj-member but the project allows 'view_task' to ws-members
    pj14 = await f.create_project(workspace=workspace, owner=user6)
    pj14.workspace_member_permissions = ["view_task"]
    await _save_project(project=pj14)
    # user7 is not a pj-member and ws-members are not allowed
    await f.create_project(workspace=workspace, owner=user6)

    res = await repositories.get_projects(
        filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user6.id}
    )
    assert len(res) == 6
    res = await repositories.get_projects(
        filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user7.id}
    )
    assert len(res) == 5


async def test_get_projects_2():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: true)
    workspace = await f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user7, workspace=workspace, role=ws_member_role)
    # user7 is not a pj-member and ws-members are not allowed
    await f.create_project(workspace=workspace, owner=user6)

    res = await repositories.get_projects(
        filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user6.id}
    )
    assert len(res) == 1
    res = await repositories.get_projects(
        filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user7.id}
    )
    assert len(res) == 0


async def test_get_workspace_projects_for_user_3():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: false)
    workspace = await f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user7, workspace=workspace, role=ws_member_role)

    res = await repositories.get_projects(
        filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user6.id}
    )
    assert len(res) == 0
    res = await repositories.get_projects(
        filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user7.id}
    )
    assert len(res) == 0


async def test_get_workspace_projects_for_user_4():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace premium, user6(ws-admin), user7(no ws-member, ws-members have permissions)
    workspace = await f.create_workspace(owner=user6, is_premium=True)
    # user7 is not a pj-member or ws-member but ws-members are allowed
    await f.create_project(workspace=workspace, owner=user6)

    res = await repositories.get_projects(
        filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user6.id}
    )
    assert len(res) == 1
    res = await repositories.get_projects(
        filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user7.id}
    )
    assert len(res) == 0


##########################################################
# get_workspace_invited_projects_for_user
##########################################################


async def test_get_workspace_invited_projects_for_user():
    user8 = await f.create_user()
    user9 = await f.create_user()

    # workspace premium, user8(ws-admin), user9(ws-member)
    workspace = await f.create_workspace(owner=user8, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user9, workspace=workspace, role=ws_member_role)
    # user8 is a pj-owner of several projects
    pj1 = await f.create_project(workspace=workspace, owner=user8)
    await f.create_project(workspace=workspace, owner=user8)
    pj3 = await f.create_project(workspace=workspace, owner=user8)
    # user8 invites user9 to several projects
    await f.create_project_invitation(email=user9.email, user=user9, project=pj1, invited_by=user8)
    await f.create_project_invitation(email=user9.email, user=user9, project=pj3, invited_by=user8)

    res = await repositories.get_projects(
        filters={
            "workspace_id": workspace.id,
            "invitee_id": user9.id,
            "invitation_status": ProjectInvitationStatus.PENDING,
        }
    )
    assert len(res) == 2
    assert res[1].name == pj1.name
    assert res[0].name == pj3.name


##########################################################
# misc - get_total_projects
##########################################################


async def test_get_total_projects_in_ws_for_admin() -> None:
    user1 = await f.create_user()
    other_user = await f.create_user()
    ws = await f.create_workspace(owner=user1)
    await f.create_project(workspace=ws, owner=other_user)
    await f.create_project(workspace=ws, owner=user1)

    res = await repositories.get_total_projects(
        filters={"project_or_workspace_member_id": user1.id, "workspace_id": ws.id}
    )
    assert res == 2


async def test_get_total_projects_in_ws_for_member() -> None:
    admin = await f.create_user()
    user1 = await f.create_user()
    ws = await f.create_workspace(owner=admin)

    ws_member_role = await _get_ws_member_role(workspace=ws)
    await f.create_workspace_membership(user=user1, workspace=ws, role=ws_member_role)

    pj1 = await f.create_project(workspace=ws, owner=admin)
    pj1.workspace_member_permissions = ["view_project"]
    await _save_project(project=pj1)

    res = await repositories.get_total_projects(
        filters={"project_or_workspace_member_id": user1.id, "workspace_id": ws.id}
    )
    assert res == 1


async def test_get_total_projects_in_ws_for_guest() -> None:
    admin = await f.create_user()
    user1 = await f.create_user()
    ws = await f.create_workspace(owner=admin)

    pj1 = await f.create_project(workspace=ws, owner=admin)
    pj_general_role = await _get_pj_member_role(project=pj1)
    await f.create_project_membership(user=user1, project=pj1, role=pj_general_role)

    pj2 = await f.create_project(workspace=ws, owner=admin)
    pj_general_role = await _get_pj_member_role(project=pj2)
    await f.create_project_membership(user=user1, project=pj2, role=pj_general_role)

    res = await repositories.get_total_projects(
        filters={"project_or_workspace_member_id": user1.id, "workspace_id": ws.id}
    )
    assert res == 2
