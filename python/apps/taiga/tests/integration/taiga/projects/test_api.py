# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from fastapi import status
from taiga.permissions import choices
from taiga.projects.models import Project
from taiga.roles.models import Role
from tests.utils import factories as f
from tests.utils.images import create_valid_testing_image

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# POST /projects
##########################################################


async def test_create_project_being_workspace_admin(client):
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}

    client.login(user)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_project_being_workspace_member(client):
    workspace = await f.create_workspace()
    general_member_role = await f.create_workspace_role(
        permissions=choices.WORKSPACE_PERMISSIONS,
        is_admin=False,
        workspace=workspace,
    )
    user2 = await f.create_user()
    await f.create_workspace_membership(user=user2, workspace=workspace, workspace_role=general_member_role)
    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}

    client.login(user2)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_project_being_no_workspace_member(client):
    workspace = await f.create_workspace()
    user2 = await f.create_user()
    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}

    client.login(user2)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_project_being_anonymous(client):
    workspace = await f.create_workspace()
    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}

    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_project_validation_error(client):
    workspace = await f.create_workspace()
    data = {"name": "My pro#%&乕شject", "color": 1, "workspace_slug": "ws-invalid"}

    client.login(workspace.owner)
    response = client.post("/projects", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET /workspaces/<slug>/projects
##########################################################


async def test_list_workspace_projects_success(client):
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    await f.create_project(workspace=workspace, owner=user)

    client.login(user)
    response = client.get(f"/workspaces/{workspace.slug}/projects")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


async def test_get_workspace_projects_workspace_not_found(client):
    user = await f.create_user()

    client.login(user)
    response = client.get("/workspaces/non-existent/projects")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


##########################################################
# GET /projects/<slug>
##########################################################


async def test_get_project_being_project_admin(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get(f"/projects/{project.slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_being_project_member(client):
    project = await f.create_project()
    general_member_role = await f.create_role(
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=False,
        project=project,
    )

    user2 = await f.create_user()
    await f.create_membership(user=user2, project=project, role=general_member_role)

    client.login(user2)
    response = client.get(f"/projects/{project.slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_being_no_project_member(client):
    project = await f.create_project()
    user2 = await f.create_user()

    client.login(user2)
    response = client.get(f"/projects/{project.slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_being_anonymous(client):
    project = await f.create_project()

    response = client.get(f"/projects/{project.slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_not_found_error(client):
    user = await f.create_user()

    client.login(user)
    response = client.get("/projects/non-existent")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


##########################################################
# GET /projects/<slug>/roles
##########################################################


async def test_get_project_roles_not_found_error(client):
    user = await f.create_user()

    client.login(user)
    response = client.get("/projects/non-existent/roles")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_project_roles_being_project_admin(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get(f"/projects/{project.slug}/roles")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_roles_being_general_member(client):
    project = await f.create_project()
    general_member_role = await f.create_role(
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=False,
        project=project,
    )
    user2 = await f.create_user()
    await f.create_membership(user=user2, project=project, role=general_member_role)

    client.login(user2)
    response = client.get(f"/projects/{project.slug}/roles")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_roles_being_no_member(client):
    project = await f.create_project()
    user2 = await f.create_user()

    client.login(user2)
    response = client.get(f"/projects/{project.slug}/roles")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_roles_being_anonymous(client):
    project = await f.create_project()

    response = client.get(f"/projects/{project.slug}/roles")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# GET /projects/<slug>/public-permissions
##########################################################


async def test_get_project_public_permissions_ok(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get(f"/projects/{project.slug}/public-permissions")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_public_permissions_no_admin(client):
    project = await f.create_project()
    user2 = await f.create_user()

    client.login(user2)
    response = client.get(f"/projects/{project.slug}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_public_permissions_no_member(client):
    project = await f.create_project()
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.slug}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_public_permissions_anonymous_user(client):
    project = await f.create_project()

    response = client.get(f"/projects/{project.slug}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# GET /projects/<slug>/workspace-member-permissions
##########################################################


async def test_get_project_workspace_member_permissions_ok(client):
    workspace = await f.create_workspace(is_premium=True)
    project = await f.create_project(workspace=workspace)

    client.login(project.owner)
    response = client.get(f"/projects/{project.slug}/workspace-member-permissions")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_workspace_member_permissions_no_premium(client):
    workspace = await f.create_workspace(is_premium=False)
    project = await f.create_project(workspace=workspace, owner=workspace.owner)

    client.login(project.owner)
    response = client.get(f"/projects/{project.slug}/workspace-member-permissions")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


@sync_to_async
def _get_role(project: Project) -> Role:
    return project.roles.get(slug="general")


async def test_get_project_workspace_member_permissions_no_admin(client):
    project = await f.create_project()
    user2 = await f.create_user()
    role = await _get_role(project=project)

    await f.create_membership(user=user2, project=project, role=role)
    client.login(user2)
    response = client.get(f"/projects/{project.slug}/workspace-member-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_workspace_member_permissions_no_member(client):
    project = await f.create_project()
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.slug}/workspace-member-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_workspace_member_permissions_anonymous_user(client):
    project = await f.create_project()

    response = client.get(f"/projects/{project.slug}/workspace-member-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# PUT /projects/<slug>/public-permissions
##########################################################


@pytest.mark.parametrize(
    "permissions",
    [
        (["view_us", "view_tasks"]),
        (["view_us", "view_tasks", "comment_task"]),
        (["view_us", "comment_us"]),
    ],
)
async def test_update_project_public_permissions_ok(client, permissions):
    project = await f.create_project()
    data = {"permissions": permissions}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_update_project_public_permissions_project_not_found(client):
    user = await f.create_user()
    data = {"permissions": ["view_us"]}

    client.login(user)
    response = client.put("/projects/non-existent/public-permissions", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


@pytest.mark.parametrize(
    "permissions",
    [
        (["view_tasks"]),
        (["comment_task"]),
        (["comment_us"]),
    ],
)
async def test_update_project_public_permissions_incompatible(client, permissions):
    project = await f.create_project()
    data = {"permissions": permissions}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_update_project_public_permissions_not_valid(client):
    project = await f.create_project()
    data = {"permissions": ["not_valid"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_update_project_public_permissions_no_admin(client):
    project = await f.create_project()
    user2 = await f.create_user()
    data = {"permissions": []}

    client.login(user2)
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_public_permissions_no_member(client):
    project = await f.create_project()
    user = await f.create_user()
    data = {"permissions": []}

    client.login(user)
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_public_permissions_anonymous_user(client):
    project = await f.create_project()
    data = {"permissions": []}

    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# PUT /projects/<slug>/workspace-member-permissions
##########################################################


async def test_update_project_workspace_member_permissions_ok(client):
    workspace = await f.create_workspace(is_premium=True)
    project = await f.create_project(workspace=workspace)
    data = {"permissions": ["view_us", "view_tasks"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/workspace-member-permissions", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_update_project_workspace_member_permissions_no_premium(client):
    workspace = await f.create_workspace(is_premium=False)
    project = await f.create_project(workspace=workspace)
    data = {"permissions": ["view_us"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/workspace-member-permissions", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_update_project_workspace_member_permissions_project_not_found(client):
    user = await f.create_user()
    data = {"permissions": ["view_us"]}

    client.login(user)
    response = client.put("/projects/non-existent/workspace-member-permissions", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_workspace_member_permissions_incompatible(client):
    project = await f.create_project()
    data = {"permissions": ["view_tasks"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/workspace-member-permissions", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_update_project_workspace_member_permissions_not_valid(client):
    project = await f.create_project()
    data = {"permissions": ["not_valid"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/workspace-member-permissions", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_update_project_workspace_member_permissions_no_admin(client):
    project = await f.create_project()
    user2 = await f.create_user()
    data = {"permissions": []}

    client.login(user2)
    response = client.put(f"/projects/{project.slug}/workspace-member-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_workspace_member_permissions_no_member(client):
    project = await f.create_project()
    user = await f.create_user()
    data = {"permissions": []}

    client.login(user)
    response = client.put(f"/projects/{project.slug}/workspace-member-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_workspace_member_permissions_anonymous_user(client):
    project = await f.create_project()
    data = {"permissions": []}

    response = client.put(f"/projects/{project.slug}/workspace-member-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
