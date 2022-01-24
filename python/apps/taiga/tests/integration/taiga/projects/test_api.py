# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from fastapi import status
from taiga.permissions import choices
from tests.utils import factories as f
from tests.utils.images import create_valid_testing_image

pytestmark = pytest.mark.django_db(transaction=True)


def test_create_project_being_workspace_admin(client):
    workspace = f.create_workspace()
    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}

    client.login(workspace.owner)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_200_OK, response.text


def test_create_project_being_workspace_member(client):
    workspace = f.WorkspaceFactory()
    general_member_role = f.WorkspaceRoleFactory(
        name="General",
        slug="general",
        permissions=choices.WORKSPACE_PERMISSIONS,
        is_admin=False,
        workspace=workspace,
    )
    user2 = f.UserFactory()
    f.WorkspaceMembershipFactory(user=user2, workspace=workspace, workspace_role=general_member_role)

    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}

    client.login(user2)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_200_OK, response.text


def test_create_project_being_no_workspace_member(client):
    workspace = f.WorkspaceFactory()
    user2 = f.UserFactory()

    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}
    client.login(user2)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_create_project_being_anonymous(client):
    workspace = f.WorkspaceFactory()

    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}

    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_create_project_validation_error(client):
    workspace = f.create_workspace()
    data = {"name": "My pro#%&乕شject", "color": 1, "workspace_slug": "ws-invalid"}

    client.login(workspace.owner)
    response = client.post("/projects", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


def test_list_workspace_projects_success(client):
    project = f.create_project()

    client.login(project.owner)
    response = client.get(f"/workspaces/{project.workspace.slug}/projects")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


def test_get_workspace_projects_workspace_not_found(client):
    user = f.UserFactory()

    client.login(user)
    response = client.get("/workspaces/non-existent/projects")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_get_project_being_project_admin(client):
    project = f.create_project()

    client.login(project.owner)
    response = client.get(f"/projects/{project.slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


def test_get_project_being_project_member(client):
    project = f.ProjectFactory()
    general_member_role = f.RoleFactory(
        name="General",
        slug="general",
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=False,
        project=project,
    )

    user2 = f.UserFactory()
    f.MembershipFactory(user=user2, project=project, role=general_member_role)

    client.login(user2)
    response = client.get(f"/projects/{project.slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


def test_get_project_being_no_project_member(client):
    project = f.ProjectFactory()

    user2 = f.UserFactory()
    client.login(user2)
    response = client.get(f"/projects/{project.slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_being_anonymous(client):
    project = f.ProjectFactory()

    response = client.get(f"/projects/{project.slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_not_found_error(client):
    user = f.UserFactory()

    client.login(user)
    response = client.get("/projects/non-existent")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_get_project_roles_not_found_error(client):
    user = f.UserFactory()

    client.login(user)
    response = client.get("/projects/non-existent/roles")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_get_project_roles_being_project_admin(client):
    project = f.create_project()

    client.login(project.owner)
    response = client.get(f"/projects/{project.slug}/roles")
    assert response.status_code == status.HTTP_200_OK, response.text


def test_get_project_roles_being_general_member(client):
    project = f.ProjectFactory()
    general_member_role = f.RoleFactory(
        name="General",
        slug="general",
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=False,
        project=project,
    )

    user2 = f.UserFactory()
    f.MembershipFactory(user=user2, project=project, role=general_member_role)

    client.login(user2)
    response = client.get(f"/projects/{project.slug}/roles")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_roles_being_no_member(client):
    project = f.ProjectFactory()

    user2 = f.UserFactory()

    client.login(user2)
    response = client.get(f"/projects/{project.slug}/roles")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_roles_being_anonymous(client):
    project = f.ProjectFactory()

    response = client.get(f"/projects/{project.slug}/roles")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_public_permissions_ok(client):
    project = f.create_project()
    client.login(project.owner)
    response = client.get(f"/projects/{project.slug}/public-permissions")
    assert response.status_code == status.HTTP_200_OK, response.text


def test_get_project_public_permissions_no_admin(client):
    project = f.create_project()
    user2 = f.UserFactory()
    client.login(user2)
    response = client.get(f"/projects/{project.slug}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_public_permissions_no_member(client):
    project = f.ProjectFactory()
    user = f.UserFactory()
    client.login(user)
    response = client.get(f"/projects/{project.slug}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_public_permissions_anonymous_user(client):
    project = f.ProjectFactory()
    response = client.get(f"/projects/{project.slug}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


@pytest.mark.parametrize(
    "permissions",
    [
        (["view_us", "view_tasks"]),
        (["view_us", "view_milestones"]),
        (["view_us", "view_tasks", "comment_task"]),
        (["view_us", "comment_us"]),
    ],
)
def test_update_project_public_permissions_ok(client, permissions):
    project = f.create_project()
    client.login(project.owner)
    data = {"permissions": permissions}
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


def test_update_project_public_permissions_project_not_found(client):
    user = f.UserFactory()
    client.login(user)
    data = {"permissions": ["view_project"]}
    response = client.put("/projects/non-existent/public-permissions", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


@pytest.mark.parametrize(
    "permissions",
    [
        (["view_tasks"]),
        (["view_milestones"]),
        (["comment_task"]),
        (["comment_us"]),
    ],
)
def test_update_project_public_permissions_incompatible(client, permissions):
    project = f.create_project()
    client.login(project.owner)
    data = {"permissions": permissions}
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


def test_update_project_public_permissions_not_valid(client):
    project = f.create_project()
    client.login(project.owner)
    data = {"permissions": ["not_valid"]}
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


def test_update_project_public_permissions_no_admin(client):
    project = f.create_project()
    user2 = f.UserFactory()
    client.login(user2)
    data = {"permissions": []}
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_update_project_public_permissions_no_member(client):
    project = f.ProjectFactory()
    user = f.UserFactory()
    client.login(user)
    data = {"permissions": []}
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_update_project_public_permissions_anonymous_user(client):
    project = f.ProjectFactory()
    data = {"permissions": []}
    response = client.put(f"/projects/{project.slug}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
