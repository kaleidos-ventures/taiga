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
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}

    client.login(user)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_200_OK, response.text


def test_create_project_being_workspace_member(client):
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    general_member_role = f.WorkspaceRoleFactory(
        name="General Members",
        slug="general-members",
        permissions=choices.WORKSPACE_MEMBERS_PERMISSIONS_LIST,
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
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    user2 = f.UserFactory()

    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}
    client.login(user2)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_create_project_being_anonymous(client):
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)

    data = {"name": "Project test", "color": 1, "workspaceSlug": workspace.slug}
    files = {"logo": ("logo.png", create_valid_testing_image(), "image/png")}

    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_create_project_validation_error(client):
    user = f.UserFactory()
    f.create_workspace(owner=user)
    data = {"name": "My pro#%&乕شject", "color": 1, "workspace_slug": "ws-invalid"}

    client.login(user)
    response = client.post("/projects", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


def test_list_projects_success(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    f.create_project(owner=user, workspace=workspace)

    client.login(user)
    response = client.get(f"/workspaces/{workspace.slug}/projects")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


def test_get_project_being_project_admin(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    slug = "project-test"
    f.create_project(slug=slug, owner=user, workspace=workspace)

    client.login(user)
    response = client.get(f"/projects/{slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


def test_get_project_being_project_member(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    slug = "project-test"
    project = f.ProjectFactory(slug=slug, owner=user, workspace=workspace)
    general_member_role = f.RoleFactory(
        name="General Members",
        slug="general-members",
        permissions=choices.MEMBERS_PERMISSIONS_LIST,
        is_admin=False,
        project=project,
    )

    user2 = f.UserFactory()
    f.MembershipFactory(user=user2, project=project, role=general_member_role)

    client.login(user2)
    response = client.get(f"/projects/{slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


def test_get_project_being_no_project_member(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    slug = "project-test"
    f.ProjectFactory(slug=slug, owner=user, workspace=workspace)

    user2 = f.UserFactory()
    client.login(user2)
    response = client.get(f"/projects/{slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_being_anonymous(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    slug = "project-test"
    f.ProjectFactory(slug=slug, owner=user, workspace=workspace)

    response = client.get(f"/projects/{slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_not_found_error(client):
    user = f.UserFactory()

    client.login(user)
    response = client.get("/projects/non-existent")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_get_project_roles_not_found_error(client):
    user = f.UserFactory()
    slug = "non-existent"

    client.login(user)
    response = client.get(f"/projects/{slug}/settings/roles")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_get_project_roles_being_project_admin(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    slug = "project-test"
    f.create_project(slug=slug, owner=user, workspace=workspace)

    client.login(user)
    response = client.get(f"/projects/{slug}/settings/roles")
    assert response.status_code == status.HTTP_200_OK, response.text


def test_get_project_roles_being_general_member(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    slug = "project-test"
    project = f.ProjectFactory(slug=slug, owner=user, workspace=workspace)
    general_member_role = f.RoleFactory(
        name="General Members",
        slug="general-members",
        permissions=choices.MEMBERS_PERMISSIONS_LIST,
        is_admin=False,
        project=project,
    )

    user2 = f.UserFactory()
    f.MembershipFactory(user=user2, project=project, role=general_member_role)

    client.login(user2)
    response = client.get(f"/projects/{slug}/settings/roles")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_roles_being_no_member(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    slug = "project-test"
    f.ProjectFactory(slug=slug, owner=user, workspace=workspace)

    user2 = f.UserFactory()

    client.login(user2)
    response = client.get(f"/projects/{slug}/settings/roles")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_get_project_roles_being_anonymous(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    slug = "project-test"
    f.ProjectFactory(slug=slug, owner=user, workspace=workspace)

    response = client.get(f"/projects/{slug}/settings/roles")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_update_project_role_permissions_anonymous_user(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    role_slug = "general-members"
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/settings/roles/{role_slug}/permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_update_project_role_permissions_project_not_found(client):
    user = f.UserFactory()
    client.login(user)
    data = {"permissions": ["view_project"]}
    response = client.put("/projects/non-existent/settings/roles/role-slug/permissions", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_update_project_role_permissions_role_not_found(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    client.login(user)
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/settings/roles/role-slug/permissions", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_update_project_role_permissions_user_without_permission(client):
    user1 = f.UserFactory()
    workspace = f.create_workspace(owner=user1)
    project = f.create_project(owner=user1, workspace=workspace)
    user2 = f.UserFactory()
    client.login(user2)
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/settings/roles/role-slug/permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_update_project_role_permissions_role_admin(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    role_slug = "admin"
    client.login(user)
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/settings/roles/{role_slug}/permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_update_project_role_permissions_ok(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    role_slug = "general-members"
    # default permissions given by template should be the same as MEMBERS_PERMISSIONS_LIST
    assert [x in project.roles.get(slug=role_slug).permissions for x in choices.MEMBERS_PERMISSIONS_LIST]
    client.login(user)
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/settings/roles/{role_slug}/permissions", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert data["permissions"] == response.json()["permissions"]
