# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import uuid

import pytest
from taiga.workspaces.invitations import repositories
from taiga.workspaces.invitations.choices import WorkspaceInvitationStatus
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# create_workspace_invitations
##########################################################


async def test_create_workspace_invitations():
    user = await f.create_user()
    user2 = await f.create_user()
    workspace = await f.create_workspace()
    objs = [
        f.build_workspace_invitation(
            user=user2,
            workspace=workspace,
            email=user2.email,
            invited_by=user,
        ),
        f.build_workspace_invitation(
            user=None,
            workspace=workspace,
            email="test@email.com",
            invited_by=user,
        ),
    ]

    response = await repositories.create_workspace_invitations(objs=objs)

    assert len(response) == 2


##########################################################
# list_workspace_invitations
##########################################################


async def test_list_workspace_invitations_all_pending_users():
    workspace = await f.create_workspace()
    user_a = await f.create_user(full_name="A", email="a@user.com")
    user_b = await f.create_user(full_name="B", email="b@user.com")
    email_a = user_a.email
    email_b = user_b.email
    email_x = "x@notauser.com"
    email_y = "y@notauser.com"
    email_z = "z@notauser.com"

    await f.create_workspace_invitation(
        email=email_a, user=user_a, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )
    await f.create_workspace_invitation(
        email=email_b, user=user_b, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )
    await f.create_workspace_invitation(
        email=email_z, user=None, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )
    await f.create_workspace_invitation(
        email=email_x, user=None, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )
    await f.create_workspace_invitation(
        email=email_y, user=None, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )
    user = await f.create_user()
    await f.create_workspace_invitation(
        email=user.email, user=user, workspace=workspace, status=WorkspaceInvitationStatus.ACCEPTED
    )

    response = await repositories.list_workspace_invitations(
        filters={"workspace_id": workspace.id, "status": WorkspaceInvitationStatus.PENDING}, offset=0, limit=100
    )
    assert len(response) == 5
    assert response[0].email == user_a.email
    assert response[1].email == user_b.email
    assert response[2].email == email_x
    assert response[3].email == email_y
    assert response[4].email == email_z


async def test_list_workspace_invitations_single_pending_user():
    workspace = await f.create_workspace()

    user1 = await f.create_user(full_name="AAA")
    await f.create_workspace_invitation(
        email=user1.email, user=user1, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )
    await f.create_workspace_invitation(
        email="non-existing@email.com",
        user=None,
        workspace=workspace,
        status=WorkspaceInvitationStatus.PENDING,
    )

    response = await repositories.list_workspace_invitations(
        filters={"workspace_id": workspace.id, "user": user1, "status": WorkspaceInvitationStatus.PENDING},
        offset=0,
        limit=100,
    )
    assert len(response) == 1
    assert response[0].email == user1.email


async def test_list_workspace_invitations_single_pending_non_existing_user():
    workspace = await f.create_workspace()

    non_existing_email = "non-existing@email.com"
    await f.create_workspace_invitation(
        email=non_existing_email, user=None, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )

    invitations = await repositories.list_workspace_invitations(
        filters={
            "workspace_id": workspace.id,
            "email": non_existing_email,
            "status": WorkspaceInvitationStatus.PENDING,
        },
        offset=0,
        limit=100,
    )
    assert len(invitations) == 1
    assert invitations[0].email == non_existing_email


async def test_list_workspace_invitations_all_accepted_users():
    workspace = await f.create_workspace()

    user1 = await f.create_user(full_name="AAA")
    await f.create_workspace_invitation(
        email=user1.email, user=user1, workspace=workspace, status=WorkspaceInvitationStatus.ACCEPTED
    )

    response = await repositories.list_workspace_invitations(
        filters={"workspace_id": workspace.id, "status": WorkspaceInvitationStatus.ACCEPTED}, offset=0, limit=100
    )
    assert len(response) == 1
    assert response[0].email == user1.email


##########################################################
# get_workspace_invitation
##########################################################


async def test_get_workspace_invitation_ok() -> None:
    invitation = await f.create_workspace_invitation()

    new_invitation = await repositories.get_workspace_invitation(filters={"id": invitation.id})

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_workspace_invitation_not_found() -> None:
    new_invitation = await repositories.get_workspace_invitation(filters={"id": 1001})

    assert new_invitation is None


async def test_get_workspace_invitation_by_user_username() -> None:
    invitation = await f.create_workspace_invitation()

    new_invitation = await repositories.get_workspace_invitation(
        filters={
            "workspace_id": invitation.workspace.id,
            "username_or_email": invitation.user.username,
            "statuses": [WorkspaceInvitationStatus.PENDING],
        }
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_workspace_invitation_by_user_email() -> None:
    invitation = await f.create_workspace_invitation()

    new_invitation = await repositories.get_workspace_invitation(
        filters={
            "workspace_id": invitation.workspace.id,
            "username_or_email": invitation.user.email,
            "statuses": [WorkspaceInvitationStatus.PENDING],
        }
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_workspace_invitation_by_email() -> None:
    invitation = await f.create_workspace_invitation(user=None)

    new_invitation = await repositories.get_workspace_invitation(
        filters={
            "workspace_id": invitation.workspace.id,
            "username_or_email": invitation.email,
            "statuses": [WorkspaceInvitationStatus.PENDING],
        }
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_workspace_invitation_by_email_no_user() -> None:
    invitation = await f.create_workspace_invitation(user=None)

    new_invitation = await repositories.get_workspace_invitation(
        filters={"workspace_id": invitation.workspace.id, "username_or_email": invitation.email}
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_workspace_invitation_by_id() -> None:
    invitation = await f.create_workspace_invitation()

    new_invitation = await repositories.get_workspace_invitation(filters={"id": invitation.id})

    assert new_invitation is not None
    assert new_invitation == invitation


async def get_workspace_invitation_by_id_not_found() -> None:
    new_invitation = await repositories.get_workspace_invitation(filters={"id": uuid.uuid1()})

    assert new_invitation is None


##########################################################
# update_workspace_invitations
##########################################################


async def test_bulk_update_workspace_invitations():
    workspace = await f.create_workspace()
    invitation1 = await f.create_workspace_invitation(workspace=workspace, num_emails_sent=1)
    invitation2 = await f.create_workspace_invitation(workspace=workspace, num_emails_sent=1)

    invitation1.num_emails_sent = 2
    invitation2.num_emails_sent = 3
    objs = [invitation1, invitation2]
    fields_to_update = ["num_emails_sent"]

    await repositories.bulk_update_workspace_invitations(objs_to_update=objs, fields_to_update=fields_to_update)

    updated_invitation1 = await repositories.get_workspace_invitation(filters={"id": invitation1.id})
    assert updated_invitation1.num_emails_sent == 2

    updated_invitation2 = await repositories.get_workspace_invitation(filters={"id": invitation2.id})
    assert updated_invitation2.num_emails_sent == 3


async def test_update_user_workspaces_invitations():
    workspace = await f.create_workspace()
    user = await f.create_user(email="some@email.com")
    invitation = await f.create_workspace_invitation(workspace=workspace, email="some@email.com", user=None)
    assert not invitation.user

    await repositories.update_user_workspaces_invitations(user=user)

    invitation = await repositories.get_workspace_invitation(filters={"id": invitation.id}, select_related=["user"])
    assert invitation.user == user


##########################################################
# delete_workspace_invitation
##########################################################


async def test_delete_workspace_invitation():
    workspace = await f.create_workspace()
    user = await f.create_user()
    await f.create_workspace_invitation(
        user=user, email=user.email, workspace=workspace, status=WorkspaceInvitationStatus.PENDING
    )

    deleted_invitation = await repositories.delete_workspace_invitation(
        filters={"workspace_id": workspace.id, "username_or_email": user.email},
    )
    assert deleted_invitation == 1


##########################################################
# misc - get_total_workspace_invitations
##########################################################


async def test_get_total_workspace_invitations():
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
    user = await f.create_user()
    await f.create_workspace_invitation(
        email=user.email, user=user, workspace=workspace, status=WorkspaceInvitationStatus.ACCEPTED
    )

    response = await repositories.get_total_workspace_invitations(
        filters={"workspace_id": workspace.id, "status": WorkspaceInvitationStatus.PENDING}
    )
    assert response == 3
