# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import uuid

import pytest
from asgiref.sync import sync_to_async
from fastapi import status
from taiga.invitations.choices import ProjectInvitationStatus
from taiga.invitations.tokens import ProjectInvitationToken
from taiga.permissions import choices
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# POST /projects/<slug>/invitations
##########################################################


async def test_create_project_invitations_anonymous_user(client):
    project = await f.create_project()
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
        ]
    }
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_project_invitations_user_without_permission(client):
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


async def test_create_project_invitations_project_not_found(client):
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


async def test_create_project_invitations_not_existing_username(client):
    user = await f.create_user()
    project = await f.create_project(owner=user)
    data = {"invitations": [{"username": "not-a-username", "role_slug": "general"}]}
    client.login(user)
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_create_project_invitations_non_existing_role(client):
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


async def test_create_project_invitations(client):
    user1 = await f.create_user()
    user2 = await f.create_user()
    await f.create_user(email="user-test@email.com")
    project = await f.create_project(owner=user1)
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
            {"username": user2.username, "role_slug": "general"},
        ]
    }
    client.login(user1)
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


async def test_get_project_invitations_admin_with_pagination(client):
    project = await f.create_project()
    general_role = await sync_to_async(project.roles.get)(slug="general")

    user1 = await f.create_user(full_name="AAA")
    await f.create_project_invitation(
        email=user1.email, user=user1, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    user2 = await f.create_user(full_name="BBB")
    await f.create_project_invitation(
        email=user2.email, user=user2, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    await f.create_project_invitation(
        email="non-existing@email.com",
        user=None,
        project=project,
        role=general_role,
        status=ProjectInvitationStatus.PENDING,
    )
    user = await f.create_user()
    await f.create_project_invitation(
        email=user.email, user=user, project=project, role=general_role, status=ProjectInvitationStatus.ACCEPTED
    )

    client.login(project.owner)

    offset = 0
    limit = 1
    response = client.get(f"/projects/{project.slug}/invitations?offset={offset}&limit={limit}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "1"
    assert response.headers["Pagination-Total"] == "3"


async def test_get_project_invitations_allowed_to_public_users(client):
    project = await f.create_project()
    not_a_member = await f.create_user()

    client.login(not_a_member)
    response = client.get(f"/projects/{project.slug}/invitations")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json() == []


async def test_get_project_invitations_not_allowed_to_anonymous_users(client):
    project = await f.create_project()

    response = client.get(f"/projects/{project.slug}/invitations")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json() == []


async def test_get_project_invitations_wrong_slug(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get("/projects/WRONG_PJ_SLUG/invitations")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


#########################################################################
# GET /projects/invitations/<token>
#########################################################################


async def test_get_project_invitation_ok(client):
    invitation = await f.create_project_invitation()
    token = await ProjectInvitationToken.create_for_object(invitation)

    response = client.get(f"/projects/invitations/{str(token)}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_invitation_invalid_token(client):
    response = client.get("/projects/invitations/invalid-token")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_get_project_invitation_invitation_does_not_exist(client):
    invitation = f.build_project_invitation(id=111)
    token = await ProjectInvitationToken.create_for_object(invitation)

    response = client.get(f"/projects/invitations/{str(token)}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


#########################################################################
# POST /projects/invitations/<token>/accept (accept a project invitation)
#########################################################################


async def test_accept_project_invitation_ok(client):
    user = await f.create_user()
    invitation = await f.create_project_invitation(email=user.email)
    token = await ProjectInvitationToken.create_for_object(invitation)

    client.login(user)
    response = client.post(f"/projects/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_accept_project_invitation_error_invitation_invalid_token(client):
    response = client.post("/projects/invitations/invalid-token/accept")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_accept_project_invitation_error_invitation_does_not_exist(client):
    invitation = f.build_project_invitation(id=111)
    token = await ProjectInvitationToken.create_for_object(invitation)

    response = client.post(f"/projects/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_accept_project_invitation_error_user_has_no_permission_over_this_invitation(client):
    user = await f.create_user()
    invitation = await f.create_project_invitation(user=await f.create_user())
    token = await ProjectInvitationToken.create_for_object(invitation)

    client.login(user)
    response = client.post(f"/projects/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_accept_project_invitation_error_invitation_already_accepted(client):
    user = await f.create_user()
    invitation = await f.create_project_invitation(email=user.email, status=ProjectInvitationStatus.ACCEPTED)
    token = await ProjectInvitationToken.create_for_object(invitation)

    client.login(user)
    response = client.post(f"/projects/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_accept_project_invitation_error_invitation_revoked(client):
    user = await f.create_user()
    invitation = await f.create_project_invitation(email=user.email, status=ProjectInvitationStatus.REVOKED)
    token = await ProjectInvitationToken.create_for_object(invitation)

    client.login(user)
    response = client.post(f"/projects/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


#########################################################################
# POST /projects/<slug>/invitations/accept authenticated user accepts a project invitation
#########################################################################


async def test_accept_user_project_invitation(client):
    project = await f.create_project()
    invited_user = await f.create_user()
    invitation = await f.create_project_invitation(
        email=invited_user.email, user=invited_user, status=ProjectInvitationStatus.PENDING, project=project
    )
    await ProjectInvitationToken.create_for_object(invitation)

    client.login(invited_user)
    response = client.post(f"projects/{project.slug}/invitations/accept")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["user"]["username"] == invited_user.username
    assert response.json()["email"] == invited_user.email


async def test_accept_user_project_not_found(client):
    project = await f.create_project()
    uninvited_user = await f.create_user()

    client.login(uninvited_user)
    response = client.post(f"projects/{project.slug}/invitations/accept")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_accept_user_already_accepted_project_invitation(client):
    project = await f.create_project()
    invited_user = await f.create_user()
    invitation = await f.create_project_invitation(
        email=invited_user.email, user=invited_user, status=ProjectInvitationStatus.ACCEPTED, project=project
    )
    await ProjectInvitationToken.create_for_object(invitation)

    client.login(invited_user)
    response = client.post(f"projects/{project.slug}/invitations/accept")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_accept_user_revoked_project_invitation(client):
    project = await f.create_project()
    invited_user = await f.create_user()
    invitation = await f.create_project_invitation(
        email=invited_user.email, user=invited_user, status=ProjectInvitationStatus.REVOKED, project=project
    )
    await ProjectInvitationToken.create_for_object(invitation)

    client.login(invited_user)
    response = client.post(f"projects/{project.slug}/invitations/accept")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


#########################################################################
# POST /projects/<slug>/invitations/resend
#########################################################################


async def test_resend_project_invitation_by_username_ok(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    await f.create_project_invitation(user=user, email=user.email, project=project)

    client.login(owner)
    data = {"username_or_email": user.username}
    response = client.post(f"projects/{project.slug}/invitations/resend", json=data)
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_resend_project_invitation_by_user_email_ok(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    await f.create_project_invitation(user=user, email=user.email, project=project)

    client.login(owner)
    data = {"username_or_email": user.email}
    response = client.post(f"projects/{project.slug}/invitations/resend", json=data)
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_resend_project_invitation_by_email_ok(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    email = "user-test@email.com"
    await f.create_project_invitation(user=None, email=email, project=project)

    client.login(owner)
    data = {"username_or_email": email}
    response = client.post(f"projects/{project.slug}/invitations/resend", json=data)
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_resend_project_invitation_user_without_permission(client):
    project = await f.create_project()
    user = await f.create_user()
    email = "user-test-2@email.com"
    await f.create_project_invitation(user=None, email=email, project=project)

    client.login(user)
    data = {"username_or_email": email}
    response = client.post(f"/projects/{project.slug}/invitations/resend", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_resend_project_invitation_not_exist(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)

    client.login(owner)
    data = {"username_or_email": "not_exist"}
    response = client.post(f"projects/{project.slug}/invitations/resend", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_resend_project_invitation_already_accepted(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    await f.create_project_invitation(
        user=user, email=user.email, project=project, status=ProjectInvitationStatus.ACCEPTED
    )

    client.login(owner)
    data = {"username_or_email": user.username}
    response = client.post(f"projects/{project.slug}/invitations/resend", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_resend_project_invitation_revoked(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    await f.create_project_invitation(
        user=user, email=user.email, project=project, status=ProjectInvitationStatus.REVOKED
    )

    client.login(owner)
    data = {"username_or_email": user.username}
    response = client.post(f"projects/{project.slug}/invitations/resend", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


#########################################################################
# POST /projects/<slug>/invitations/revoke
#########################################################################


async def test_revoke_project_invitation_for_email_ok(client):
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    email = "someone@email.com"
    await f.create_project_invitation(user=None, email=email, project=project, status=ProjectInvitationStatus.PENDING)

    client.login(admin)
    data = {"username_or_email": email}
    response = client.post(f"projects/{project.slug}/invitations/revoke", json=data)
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_revoke_project_invitation_for_username_ok(client):
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    user = await f.create_user()
    await f.create_project_invitation(
        user=user, email=user.email, project=project, status=ProjectInvitationStatus.PENDING
    )

    client.login(admin)
    data = {"username_or_email": user.username}
    response = client.post(f"projects/{project.slug}/invitations/revoke", json=data)
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_revoke_project_invitation_for_user_email_ok(client):
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    user = await f.create_user()
    await f.create_project_invitation(
        user=user, email=user.email, project=project, status=ProjectInvitationStatus.PENDING
    )

    client.login(admin)
    data = {"username_or_email": user.email}
    response = client.post(f"projects/{project.slug}/invitations/revoke", json=data)
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_revoke_project_invitation_not_found(client):
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    user = await f.create_user()

    client.login(admin)
    data = {"username_or_email": user.email}
    response = client.post(f"projects/{project.slug}/invitations/revoke", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_revoke_project_invitation_not_found_2(client):
    admin = await f.create_user()
    project = await f.create_project(owner=admin)

    client.login(admin)
    data = {"username_or_email": "nouser"}
    response = client.post(f"projects/{project.slug}/invitations/revoke", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_revoke_project_invitation_already_member_invalid(client):
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    general_member_role = await f.create_project_role(
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
        project=project,
    )
    user = await f.create_user()
    await f.create_project_membership(user=user, project=project, role=general_member_role)
    await f.create_project_invitation(
        user=user, email=user.email, project=project, status=ProjectInvitationStatus.ACCEPTED
    )

    client.login(admin)
    data = {"username_or_email": user.email}
    response = client.post(f"projects/{project.slug}/invitations/revoke", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_revoke_project_invitation_revoked(client):
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    general_member_role = await f.create_project_role(
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
        project=project,
    )
    user = await f.create_user()
    await f.create_project_membership(user=user, project=project, role=general_member_role)
    await f.create_project_invitation(
        user=user, email=user.email, project=project, status=ProjectInvitationStatus.REVOKED
    )

    client.login(admin)
    data = {"username_or_email": user.email}
    response = client.post(f"projects/{project.slug}/invitations/revoke", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


##########################################################
# PATCH /projects/<slug>/invitations/<id>
##########################################################


async def test_update_project_invitation_role_invitation_not_exist(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)

    client.login(owner)
    id = uuid.uuid1()
    data = {"role_slug": "admin"}
    response = client.patch(f"projects/{project.slug}/invitations/{id}", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_invitation_role_user_without_permission(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    await f.create_project_membership(user=user, project=project, role=general_member_role)

    invited_user = await f.create_user()
    invitation = await f.create_project_invitation(
        user=invited_user, project=project, role=general_member_role, email=invited_user.email
    )

    client.login(user)
    data = {"role_slug": "admin"}
    response = client.patch(f"/projects/{project.slug}/invitations/{invitation.id}", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_invitation_role_ok(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    invitation = await f.create_project_invitation(
        user=user, project=project, role=general_member_role, email=user.email
    )

    client.login(owner)
    data = {"role_slug": "admin"}
    response = client.patch(f"projects/{project.slug}/invitations/{invitation.id}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
