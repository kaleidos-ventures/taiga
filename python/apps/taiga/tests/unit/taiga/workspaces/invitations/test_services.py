# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import timedelta
from unittest.mock import patch

import pytest
from taiga.base.utils.datetime import aware_utcnow
from taiga.workspaces.invitations import services
from taiga.workspaces.invitations.services.exceptions import NonExistingUsernameError
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#######################################################
# create_workspace_invitations
#######################################################


async def test_create_workspace_invitations_already_member(tqmanager):
    user = f.build_user()
    workspace = f.build_workspace()
    invitations = [{"username_or_email": user.email}]

    with (
        patch("taiga.workspaces.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.workspaces.invitations.services.memberships_repositories", autospec=True) as fake_memberships_repo,
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_users_services.list_users_emails_as_dict.return_value = {user.email: user}
        fake_users_services.list_users_usernames_as_dict.return_value = {}
        fake_memberships_repo.list_workspace_members.return_value = [user]

        await services.create_workspace_invitations(
            workspace=workspace, invitations=invitations, invited_by=workspace.created_by
        )

        fake_invitations_repo.create_workspace_invitations.assert_not_awaited()
        assert len(tqmanager.pending_jobs) == 0
        fake_invitations_events.emit_event_when_workspace_invitations_are_created.assert_not_awaited()


async def test_create_workspace_invitations_with_pending_invitations(tqmanager):
    workspace = f.build_workspace()
    created_at = aware_utcnow() - timedelta(days=1)  # to avoid time spam
    invitation = f.build_workspace_invitation(
        workspace=workspace,
        user=None,
        email="test@email.com",
        created_at=created_at,
        invited_by=workspace.created_by,
    )
    invitations = [{"username_or_email": invitation.email}]

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_invitations_repo.get_workspace_invitation.return_value = invitation
        fake_users_services.list_users_emails_as_dict.return_value = {}
        fake_users_services.list_users_usernames_as_dict.return_value = {}

        await services.create_workspace_invitations(
            workspace=workspace, invitations=invitations, invited_by=workspace.created_by
        )

        fake_invitations_repo.bulk_update_workspace_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 1
        fake_invitations_events.emit_event_when_workspace_invitations_are_created.assert_awaited_once()


async def test_create_workspace_invitations_with_pending_invitations_time_spam(tqmanager, override_settings):
    workspace = f.build_workspace()
    invitation = f.build_workspace_invitation(
        user=None, workspace=workspace, email="test@email.com", invited_by=workspace.created_by
    )
    invitations = [{"username_or_email": invitation.email}]

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        override_settings({"WORKSPACE_INVITATION_RESEND_TIME": 10}),
    ):
        fake_invitations_repo.get_workspace_invitation.return_value = invitation
        fake_users_services.list_users_emails_as_dict.return_value = {}
        fake_users_services.list_users_usernames_as_dict.return_value = {}

        await services.create_workspace_invitations(
            workspace=workspace, invitations=invitations, invited_by=workspace.created_by
        )

        fake_invitations_repo.bulk_update_workspace_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 0
        fake_invitations_events.emit_event_when_workspace_invitations_are_created.assert_not_awaited()


async def test_create_workspace_invitations_by_emails(tqmanager):
    user1 = f.build_user()
    user2 = f.build_user(email="user-test@email.com")
    workspace = f.build_workspace()

    invitations = [
        {"username_or_email": user2.email},
        {"username_or_email": "test@email.com"},
    ]

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_users_services.list_users_emails_as_dict.return_value = {user2.email: user2}
        fake_users_services.list_users_usernames_as_dict.return_value = {}
        fake_invitations_repo.get_workspace_invitation.return_value = None

        await services.create_workspace_invitations(workspace=workspace, invitations=invitations, invited_by=user1)

        fake_users_services.list_users_emails_as_dict.assert_awaited_once()
        fake_users_services.list_users_usernames_as_dict.assert_not_awaited()
        fake_invitations_repo.create_workspace_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 2
        fake_invitations_events.emit_event_when_workspace_invitations_are_created.assert_awaited_once()


async def test_create_workspace_invitations_by_usernames(tqmanager):
    user1 = f.build_user()
    user2 = f.build_user()
    user3 = f.build_user()
    workspace = f.build_workspace()

    invitations = [
        {"username_or_email": user2.username},
        {"username_or_email": user3.username},
    ]

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_users_services.list_users_emails_as_dict.return_value = {}
        fake_users_services.list_users_usernames_as_dict.return_value = {user2.username: user2, user3.username: user3}
        fake_invitations_repo.get_workspace_invitation.return_value = None

        await services.create_workspace_invitations(workspace=workspace, invitations=invitations, invited_by=user1)

        fake_invitations_repo.create_workspace_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 2
        fake_invitations_events.emit_event_when_workspace_invitations_are_created.assert_awaited_once()


async def test_create_workspace_invitations_duplicated_email_username(tqmanager):
    user1 = f.build_user(email="test1@email.com", username="user1")
    user2 = f.build_user(email="test2@email.com", username="user2")
    user3 = f.build_user(email="test3@email.com", username="user3")
    user4 = f.build_user(email="test4@email.com", username="user4")
    workspace = f.build_workspace()

    invitations = [
        {"username_or_email": user2.username, "email": "test2@email.com"},
        {"username_or_email": user3.username},
        {"username_or_email": user4.username},
        {"username_or_email": "test3@email.com"},
        {"username_or_email": "test4@email.com"},
    ]

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_users_services.list_users_emails_as_dict.return_value = {user3.email: user3, user4.email: user4}
        fake_users_services.list_users_usernames_as_dict.return_value = {
            user2.username: user2,
            user3.username: user3,
            user4.username: user4,
        }
        fake_invitations_repo.get_workspace_invitation.return_value = None

        await services.create_workspace_invitations(workspace=workspace, invitations=invitations, invited_by=user1)

        fake_users_services.list_users_emails_as_dict.assert_awaited_once()
        fake_users_services.list_users_usernames_as_dict.assert_awaited_once()
        fake_invitations_repo.create_workspace_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 3
        assert list(map(lambda x: x["args"]["to"], tqmanager.pending_jobs)) == [user3.email, user4.email, user2.email]
        fake_invitations_events.emit_event_when_workspace_invitations_are_created.assert_awaited_once()


async def test_create_workspace_invitations_invalid_username(tqmanager):
    user1 = f.build_user(email="test@email.com", username="user1")
    workspace = f.build_workspace()

    invitations = [{"username_or_email": "not existing username"}]

    with (
        patch("taiga.workspaces.invitations.services.users_services", autospec=True) as fake_users_services,
        pytest.raises(NonExistingUsernameError),
    ):
        fake_users_services.list_users_emails_as_dict.return_value = {}
        fake_users_services.list_users_usernames_as_dict.return_value = {}

        await services.create_workspace_invitations(workspace=workspace, invitations=invitations, invited_by=user1)


#######################################################
# send_workspace_invitation_email
#######################################################


async def test_send_workspace_invitations_for_existing_user(tqmanager, correlation_id):
    user = f.build_user(email="user-test@email.com")
    workspace = f.build_workspace()

    invitation = f.build_workspace_invitation(
        user=user, workspace=workspace, email=user.email, invited_by=workspace.created_by
    )

    with patch(
        "taiga.workspaces.invitations.services.WorkspaceInvitationToken", autospec=True
    ) as FakeWorkspaceInvitationToken:
        FakeWorkspaceInvitationToken.create_for_object.return_value = "invitation-token"

        await services.send_workspace_invitation_email(invitation=invitation)

        assert len(tqmanager.pending_jobs) == 1

        job = tqmanager.pending_jobs[0]
        assert "send_email" in job["task_name"]

        args = job["args"]
        assert args["email_name"] == "workspace_invitation"
        assert args["to"] == invitation.email
        assert args["lang"] == invitation.user.lang
        assert args["context"]["invitation_token"] == "invitation-token"
        assert args["context"]["workspace_color"] == invitation.workspace.color
        assert args["context"]["workspace_name"] == invitation.workspace.name
        assert args["context"]["workspace_id"] == invitation.workspace.b64id
        assert args["context"]["receiver_name"] == invitation.user.full_name
        assert args["context"]["sender_name"] == invitation.invited_by.full_name


async def test_send_workspace_invitations_for_new_user(tqmanager):
    workspace = f.build_workspace()

    invitation = f.build_workspace_invitation(
        user=None, workspace=workspace, email="test@email.com", invited_by=workspace.created_by
    )

    with patch(
        "taiga.workspaces.invitations.services.WorkspaceInvitationToken", autospec=True
    ) as FakeWorkspaceInvitationToken:
        FakeWorkspaceInvitationToken.create_for_object.return_value = "invitation-token"

        await services.send_workspace_invitation_email(invitation=invitation)

        assert len(tqmanager.pending_jobs) == 1

        job = tqmanager.pending_jobs[0]
        assert "send_email" in job["task_name"]

        args = job["args"]
        assert args["email_name"] == "workspace_invitation"
        assert args["to"] == invitation.email
        assert args["context"]["invitation_token"] == "invitation-token"
        assert args["context"]["workspace_color"] == invitation.workspace.color
        assert args["context"]["workspace_name"] == invitation.workspace.name
        assert args["context"]["workspace_id"] == invitation.workspace.b64id
        assert args["context"]["receiver_name"] is None
        assert args["context"]["sender_name"] == invitation.invited_by.full_name
