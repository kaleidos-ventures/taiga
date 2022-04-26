# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from fastapi import status
from taiga.invitations.choices import InvitationStatus
from taiga.invitations.tokens import ProjectInvitationToken
from taiga.permissions import choices
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# POST /projects/<slug>/invitations
##########################################################


async def test_create_invitations_anonymous_user(client):
    project = await f.create_project()
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
        ]
    }
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_invitations_user_without_permission(client):
    project = await f.create_project()
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
        ]
    }
    user = await f.create_user()
    client.login(user)
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_invitations_project_not_found(client):
    user = await f.create_user()
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
        ]
    }
    client.login(user)
    response = client.post("/projects/non-existent/invitations", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_invitations_non_existing_role(client):
    user = await f.create_user()
    project = await f.create_project(owner=user)
    data = {
        "invitations": [
            {"email": "test@email.com", "role_slug": "non_existing_role"},
        ]
    }
    client.login(user)
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_create_invitations(client):
    user = await f.create_user()
    await f.create_user(email="user-test@email.com")
    project = await f.create_project(owner=user)
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
        ]
    }
    client.login(user)
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


##########################################################
# GET /projects/<slug>/invitations
##########################################################


async def test_get_project_invitations_admin(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get(f"/projects/{project.slug}/invitations")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_invitations_member(client):
    project = await f.create_project()
    general_member_role = await f.create_role(
        project=project,
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=False,
    )

    pj_member = await f.create_user()
    await f.create_membership(user=pj_member, project=project, role=general_member_role)

    client.login(pj_member)
    response = client.get(f"/projects/{project.slug}/invitations")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_invitations_wrong_slug(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get("/projects/WRONG_PJ_SLUG/invitations")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_project_invitations_not_a_member(client):
    project = await f.create_project()
    not_a_member = await f.create_user()

    client.login(not_a_member)
    response = client.get(f"/projects/{project.slug}/invitations")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


#########################################################################
# GET /projects/invitations/<token>
#########################################################################


async def test_get_project_invitation_ok(client):
    invitation = await f.create_invitation()
    token = await ProjectInvitationToken.create_for_object(invitation)

    response = client.get(f"/projects/invitations/{str(token)}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_invitation_invalid_token(client):
    response = client.get("/projects/invitations/invalid-token")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_get_project_invitation_invitation_does_not_exist(client):
    invitation = f.build_invitation(id=111)
    token = await ProjectInvitationToken.create_for_object(invitation)

    response = client.get(f"/projects/invitations/{str(token)}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


#########################################################################
# POST /projects/invitations/<token>/accept
#########################################################################


async def test_accept_project_invitation_ok(client):
    user = await f.create_user()
    invitation = await f.create_invitation(email=user.email)
    token = await ProjectInvitationToken.create_for_object(invitation)

    client.login(user)
    response = client.post(f"/projects/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_accept_project_invitation_error_invitation_invalid_token(client):
    response = client.post("/projects/invitations/invalid-token/accept")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_accept_project_invitation_error_invitation_does_not_exist(client):
    invitation = f.build_invitation(id=111)
    token = await ProjectInvitationToken.create_for_object(invitation)

    response = client.post(f"/projects/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_accept_project_invitation_error_user_has_no_permission_over_this_invitation(client):
    user = await f.create_user()
    invitation = await f.create_invitation(user=await f.create_user())
    token = await ProjectInvitationToken.create_for_object(invitation)

    client.login(user)
    response = client.post(f"/projects/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_accept_project_invitation_error_invitation_already_accepted(client):
    user = await f.create_user()
    invitation = await f.create_invitation(email=user.email, status=InvitationStatus.ACCEPTED)
    token = await ProjectInvitationToken.create_for_object(invitation)

    client.login(user)
    response = client.post(f"/projects/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text
