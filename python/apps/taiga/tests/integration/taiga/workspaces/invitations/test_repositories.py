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

pytestmark = pytest.mark.django_db


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
# update_workspace_invitation
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
