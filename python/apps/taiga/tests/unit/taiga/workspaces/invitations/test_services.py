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
from taiga.workspaces.invitations.choices import WorkspaceInvitationStatus
from taiga.workspaces.invitations.services import exceptions as ex
from taiga.workspaces.invitations.tokens import WorkspaceInvitationToken
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
        override_settings({"INVITATION_RESEND_TIME": 10}),
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
        pytest.raises(ex.NonExistingUsernameError),
    ):
        fake_users_services.list_users_emails_as_dict.return_value = {}
        fake_users_services.list_users_usernames_as_dict.return_value = {}

        await services.create_workspace_invitations(workspace=workspace, invitations=invitations, invited_by=user1)


#######################################################
# list_paginated_pending_workspace_invitations
#######################################################


async def test_list_workspace_invitations():
    invitation = f.build_workspace_invitation()

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
    ):
        fake_invitations_repo.list_workspace_invitations.return_value = [invitation]

        pagination, invitations = await services.list_paginated_pending_workspace_invitations(
            workspace=invitation.workspace, offset=0, limit=10
        )

        fake_invitations_repo.list_workspace_invitations.assert_awaited_once_with(
            filters={
                "workspace_id": invitation.workspace.id,
                "status": WorkspaceInvitationStatus.PENDING,
            },
            select_related=["user", "workspace"],
            offset=pagination.offset,
            limit=pagination.limit,
        )
        fake_invitations_repo.get_total_workspace_invitations.assert_awaited_once_with(
            filters={
                "workspace_id": invitation.workspace.id,
                "status": WorkspaceInvitationStatus.PENDING,
            }
        )
        assert invitations == [invitation]


#######################################################
# get_workspace_invitation
#######################################################


async def test_get_workspace_invitation_ok():
    invitation = f.build_workspace_invitation()
    token = str(await WorkspaceInvitationToken.create_for_object(invitation))

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
    ):
        fake_invitations_repo.get_workspace_invitation.return_value = invitation
        inv = await services.get_workspace_invitation(token)
        fake_invitations_repo.get_workspace_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "workspace"],
        )
        assert inv == invitation


async def test_get_workspace_invitation_error_invalid_token():
    with pytest.raises(ex.BadInvitationTokenError):
        await services.get_workspace_invitation("invalid-token")


async def test_get_workspace_invitation_error_not_found():
    invitation = f.build_workspace_invitation()
    token = str(await WorkspaceInvitationToken.create_for_object(invitation))

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
    ):
        fake_invitations_repo.get_workspace_invitation.return_value = None
        inv = await services.get_workspace_invitation(token)
        fake_invitations_repo.get_workspace_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "workspace"],
        )
        assert inv is None


#######################################################
# get_public_workspace_invitation
#######################################################


async def test_get_public_workspace_invitation_ok():
    user = f.build_user(is_active=True)
    invitation = f.build_workspace_invitation(user=user)
    token = str(await WorkspaceInvitationToken.create_for_object(invitation))
    available_user_logins = ["gitlab", "password"]

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.auth_services", autospec=True) as fake_auth_services,
    ):
        fake_invitations_repo.get_workspace_invitation.return_value = invitation
        fake_auth_services.get_available_user_logins.return_value = available_user_logins
        pub_invitation = await services.get_public_workspace_invitation(token=token)
        fake_invitations_repo.get_workspace_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "workspace"],
        )
        fake_auth_services.get_available_user_logins.assert_awaited_once_with(user=invitation.user)

        assert pub_invitation.email == invitation.email
        assert pub_invitation.existing_user is True
        assert pub_invitation.workspace.name == invitation.workspace.name
        assert pub_invitation.available_logins == available_user_logins


async def test_get_public_workspace_invitation_ok_without_user():
    invitation = f.build_workspace_invitation(user=None)
    token = str(await WorkspaceInvitationToken.create_for_object(invitation))

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.auth_services", autospec=True) as fake_auth_services,
    ):
        fake_invitations_repo.get_workspace_invitation.return_value = invitation
        pub_invitation = await services.get_public_workspace_invitation(token)
        fake_invitations_repo.get_workspace_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "workspace"],
        )
        fake_auth_services.get_available_user_logins.assert_not_awaited()

        assert pub_invitation.email == invitation.email
        assert pub_invitation.existing_user is False
        assert pub_invitation.workspace.name == invitation.workspace.name
        assert pub_invitation.available_logins == []


async def test_get_public_workspace_invitation_error_invitation_not_exists():
    invitation = f.build_workspace_invitation(user=None)
    token = str(await WorkspaceInvitationToken.create_for_object(invitation))

    with patch(
        "taiga.workspaces.invitations.services.invitations_repositories", autospec=True
    ) as fake_invitations_repo:
        fake_invitations_repo.get_workspace_invitation.return_value = None
        pub_invitation = await services.get_public_workspace_invitation(token)
        fake_invitations_repo.get_workspace_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "workspace"],
        )
        assert pub_invitation is None


#######################################################
# update_user_workspaces_invitations
#######################################################


async def test_update_user_workspaces_invitations() -> None:
    user = f.build_user()
    with (
        patch(
            "taiga.workspaces.invitations.services.invitations_repositories", autospec=True
        ) as fake_invitations_repositories,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        await services.update_user_workspaces_invitations(user=user)
        fake_invitations_repositories.update_user_workspaces_invitations.assert_awaited_once_with(user=user)
        fake_invitations_repositories.list_workspace_invitations.assert_awaited_once_with(
            filters={"user": user, "status": WorkspaceInvitationStatus.PENDING},
            select_related=["workspace"],
        )
        fake_invitations_events.emit_event_when_workspace_invitations_are_updated.assert_awaited_once()


#######################################################
# accept_workspace_invitation
#######################################################


async def tests_accept_workspace_invitation() -> None:
    user = f.build_user()
    workspace = f.build_workspace()
    invitation = f.build_workspace_invitation(workspace=workspace, user=user, email=user.email)

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.memberships_repositories", autospec=True) as fake_memberships_repo,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_invitations_repo.update_workspace_invitation.return_value = invitation
        await services.accept_workspace_invitation(invitation=invitation)

        fake_invitations_repo.update_workspace_invitation.assert_awaited_once_with(
            invitation=invitation,
            values={"status": WorkspaceInvitationStatus.ACCEPTED},
        )
        fake_memberships_repo.create_workspace_membership.assert_awaited_once_with(workspace=workspace, user=user)
        fake_invitations_events.emit_event_when_workspace_invitation_is_accepted.assert_awaited_once_with(
            invitation=invitation
        )


async def tests_accept_workspace_invitation_error_invitation_has_already_been_accepted() -> None:
    user = f.build_user()
    workspace = f.build_workspace()
    invitation = f.build_workspace_invitation(
        workspace=workspace, user=user, status=WorkspaceInvitationStatus.ACCEPTED, email=user.email
    )

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.InvitationAlreadyAcceptedError),
    ):
        await services.accept_workspace_invitation(invitation=invitation)

        fake_invitations_repo.accept_workspace_invitation.assert_not_awaited()
        fake_invitations_events.emit_event_when_workspace_invitation_is_accepted.assert_not_awaited()


async def tests_accept_workspace_invitation_error_invitation_has_been_revoked() -> None:
    user = f.build_user()
    workspace = f.build_workspace()
    invitation = f.build_workspace_invitation(
        workspace=workspace, user=user, status=WorkspaceInvitationStatus.REVOKED, email=user.email
    )

    with (
        patch("taiga.workspaces.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.workspaces.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.InvitationRevokedError),
    ):
        await services.accept_workspace_invitation(invitation=invitation)

        fake_invitations_repo.accept_workspace_invitation.assert_not_awaited()
        fake_invitations_events.emit_event_when_workspace_invitation_is_accepted.assert_not_awaited()


#######################################################
# accept_workspace_invitation_from_token
#######################################################


async def tests_accept_workspace_invitation_from_token_ok() -> None:
    user = f.build_user()
    invitation = f.build_workspace_invitation(user=user, email=user.email)
    token = str(await WorkspaceInvitationToken.create_for_object(invitation))

    with (
        patch(
            "taiga.workspaces.invitations.services.get_workspace_invitation", autospec=True
        ) as fake_get_workspace_invitation,
        patch(
            "taiga.workspaces.invitations.services.accept_workspace_invitation", autospec=True
        ) as fake_accept_workspace_invitation,
    ):
        fake_get_workspace_invitation.return_value = invitation

        await services.accept_workspace_invitation_from_token(token=token, user=user)

        fake_get_workspace_invitation.assert_awaited_once_with(token=token)
        fake_accept_workspace_invitation.assert_awaited_once_with(invitation=invitation)


async def tests_accept_workspace_invitation_from_token_error_no_invitation_found() -> None:
    user = f.build_user()

    with (
        patch(
            "taiga.workspaces.invitations.services.get_workspace_invitation", autospec=True
        ) as fake_get_workspace_invitation,
        patch(
            "taiga.workspaces.invitations.services.accept_workspace_invitation", autospec=True
        ) as fake_accept_workspace_invitation,
        pytest.raises(ex.InvitationDoesNotExistError),
    ):
        fake_get_workspace_invitation.return_value = None

        await services.accept_workspace_invitation_from_token(token="some_token", user=user)

        fake_get_workspace_invitation.assert_awaited_once_with(token="some_token")
        fake_accept_workspace_invitation.assert_not_awaited()


async def tests_accept_workspace_invitation_from_token_error_invitation_is_for_other_user() -> None:
    user = f.build_user()
    other_user = f.build_user()
    invitation = f.build_workspace_invitation(user=other_user, email=other_user.email)
    token = str(await WorkspaceInvitationToken.create_for_object(invitation))

    with (
        patch(
            "taiga.workspaces.invitations.services.get_workspace_invitation", autospec=True
        ) as fake_get_workspace_invitation,
        patch(
            "taiga.workspaces.invitations.services.accept_workspace_invitation", autospec=True
        ) as fake_accept_workspace_invitation,
        pytest.raises(ex.InvitationIsNotForThisUserError),
    ):
        fake_get_workspace_invitation.return_value = invitation

        await services.accept_workspace_invitation_from_token(token=token, user=user)

        fake_get_workspace_invitation.assert_awaited_once_with(token=token)
        fake_accept_workspace_invitation.assert_not_awaited()


async def tests_accept_workspace_invitation_from_token_error_already_accepted() -> None:
    user = f.build_user()
    invitation = f.build_workspace_invitation(user=user, email=user.email, status=WorkspaceInvitationStatus.ACCEPTED)
    token = str(await WorkspaceInvitationToken.create_for_object(invitation))

    with (
        patch(
            "taiga.workspaces.invitations.services.get_workspace_invitation", autospec=True
        ) as fake_get_workspace_invitation,
        pytest.raises(ex.InvitationAlreadyAcceptedError),
    ):
        fake_get_workspace_invitation.return_value = invitation

        await services.accept_workspace_invitation_from_token(token=token, user=user)

        fake_get_workspace_invitation.assert_awaited_once_with(token=token)


async def tests_accept_workspace_invitation_from_token_error_revoked() -> None:
    user = f.build_user()
    invitation = f.build_workspace_invitation(user=user, email=user.email, status=WorkspaceInvitationStatus.REVOKED)
    token = str(await WorkspaceInvitationToken.create_for_object(invitation))

    with (
        patch(
            "taiga.workspaces.invitations.services.get_workspace_invitation", autospec=True
        ) as fake_get_workspace_invitation,
        pytest.raises(ex.InvitationRevokedError),
    ):
        fake_get_workspace_invitation.return_value = invitation

        await services.accept_workspace_invitation_from_token(token=token, user=user)

        fake_get_workspace_invitation.assert_awaited_once_with(token=token)


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
