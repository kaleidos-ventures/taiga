# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


import pytest
from fastapi import status
from taiga.workspaces.invitations.choices import WorkspaceInvitationStatus
from taiga.workspaces.invitations.tokens import WorkspaceInvitationToken
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# POST /workspaces/<id>/invitations
##########################################################


async def test_create_workspace_invitations_anonymous_user(client):
    workspace = await f.create_workspace()
    data = {
        "invitations": [
            {"username_or_email": "user-test@email.com"},
            {"username_or_email": "test@email.com"},
        ]
    }
    response = client.post(f"/workspaces/{workspace.b64id}/invitations", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_workspace_invitations_user_without_permission(client):
    workspace = await f.create_workspace()
    data = {
        "invitations": [
            {"username_or_email": "user-test@email.com"},
            {"username_or_email": "test@email.com"},
        ]
    }
    user = await f.create_user()
    client.login(user)
    response = client.post(f"/workspaces/{workspace.b64id}/invitations", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_workspace_invitations_workspace_not_found(client):
    user = await f.create_user()
    data = {
        "invitations": [
            {"username_or_email": "user-test@email.com"},
            {"username_or_email": "test@email.com"},
        ]
    }
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"
    client.login(user)
    response = client.post(f"/workspaces/{non_existent_id}/invitations", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_workspace_invitations_not_existing_username(client):
    workspace = await f.create_workspace()
    data = {"invitations": [{"username_or_email": "not-a-username"}]}
    client.login(workspace.created_by)
    response = client.post(f"/workspaces/{workspace.b64id}/invitations", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_create_workspace_invitations(client):
    invitee1 = await f.create_user(email="invitee1@taiga.demo", username="invitee1")
    await f.create_user(email="invitee2@taiga.demo", username="invitee2")
    workspace = await f.create_workspace()
    data = {
        "invitations": [
            {"username_or_email": "invitee2@taiga.demo"},
            {"username_or_email": "test@email.com"},
            {"username_or_email": invitee1.username},
        ]
    }
    client.login(workspace.created_by)
    response = client.post(f"/workspaces/{workspace.b64id}/invitations", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


##########################################################
# LIST /workspaces/<id>/invitations
##########################################################


async def test_list_workspaces_invitations(client):
    workspace = await f.create_workspace()

    user1 = await f.create_user(full_name="AAA")
    await f.create_workspace_invitation(
        email=user1.email, user=user1, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )
    user2 = await f.create_user(full_name="BBB")
    await f.create_workspace_invitation(
        email=user2.email, user=user2, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )
    await f.create_workspace_invitation(
        email="non-existing@email.com",
        user=None,
        workspace=workspace,
        status=WorkspaceInvitationStatus.PENDING,
    )
    user3 = await f.create_user()
    await f.create_workspace_invitation(
        email=user3.email, user=user3, workspace=workspace, status=WorkspaceInvitationStatus.ACCEPTED
    )

    client.login(workspace.created_by)

    response = client.get(f"/workspaces/{workspace.b64id}/invitations")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 3


async def test_list_workspaces_invitations_no_permissions(client):
    workspace = await f.create_workspace()
    user1 = await f.create_user(full_name="AAA")
    client.login(user1)
    response = client.get(f"/workspaces/{workspace.b64id}/invitations")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_list_workspaces_invitations_not_found(client):
    workspace = await f.create_workspace()
    client.login(workspace.created_by)
    response = client.get("/workspaces/non-existing-id/invitations")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


#########################################################################
# GET /workspaces/invitations/<token>
#########################################################################


async def test_get_workspace_invitation_ok(client):
    invitation = await f.create_workspace_invitation()
    token = await WorkspaceInvitationToken.create_for_object(invitation)

    response = client.get(f"/workspaces/invitations/{str(token)}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_workspace_invitation_invalid_token(client):
    response = client.get("/workspaces/invitations/invalid-token")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_get_workspace_invitation_invitation_does_not_exist(client):
    invitation = f.build_workspace_invitation(id=111)
    token = await WorkspaceInvitationToken.create_for_object(invitation)

    response = client.get(f"/workspaces/invitations/{str(token)}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


#########################################################################
# POST /workspaces/invitations/<token>/accept
#########################################################################


async def test_accept_workspace_invitation_ok(client):
    user = await f.create_user()
    invitation = await f.create_workspace_invitation(email=user.email)
    token = await WorkspaceInvitationToken.create_for_object(invitation)

    client.login(user)
    response = client.post(f"/workspaces/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_accept_workspace_invitation_error_invitation_invalid_token(client):
    response = client.post("/workspaces/invitations/invalid-token/accept")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_accept_workspace_invitation_error_invitation_does_not_exist(client):
    invitation = f.build_workspace_invitation(id=111)
    token = await WorkspaceInvitationToken.create_for_object(invitation)

    response = client.post(f"/workspaces/invitations/{str(token)}/accept")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
