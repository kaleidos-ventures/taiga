# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.invitations import services
from taiga.invitations.choices import InvitationStatus
from taiga.invitations.services import exceptions as ex
from taiga.invitations.services.exceptions import NonExistingUsernameError
from taiga.invitations.tokens import ProjectInvitationToken
from tests.utils import factories as f

#######################################################
# get_project_invitation
#######################################################


async def test_get_project_invitation_ok():
    invitation = f.build_invitation(id=123)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,):
        fake_invitations_repo.get_project_invitation.return_value = invitation
        inv = await services.get_project_invitation(token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(id=invitation.id)
        assert inv == invitation


async def test_get_project_invitation_error_invalid_token():
    with pytest.raises(ex.BadInvitationTokenError):
        await services.get_project_invitation("invalid-token")


async def test_get_project_invitation_error_not_found():
    invitation = f.build_invitation(id=123)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,):
        fake_invitations_repo.get_project_invitation.return_value = None
        inv = await services.get_project_invitation(token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(id=invitation.id)
        assert inv is None


#######################################################
# get_public_project_invitation
#######################################################


async def test_get_public_project_invitation_ok():
    invitation = f.build_invitation(id=123)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,):
        fake_invitations_repo.get_project_invitation.return_value = invitation
        pub_invitation = await services.get_public_project_invitation(token=token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(id=invitation.id)
        assert pub_invitation.status == invitation.status
        assert pub_invitation.email == invitation.email
        assert pub_invitation.existing_user is True
        assert pub_invitation.project == invitation.project


async def test_get_public_project_invitation_ok_without_user():
    invitation = f.build_invitation(id=123, user=None)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,):
        fake_invitations_repo.get_project_invitation.return_value = invitation
        pub_invitation = await services.get_public_project_invitation(token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(id=invitation.id)
        assert pub_invitation.status == invitation.status
        assert pub_invitation.email == invitation.email
        assert pub_invitation.existing_user is False
        assert pub_invitation.project == invitation.project


async def test_get_public_project_invitation_error_invitation_not_exists():
    invitation = f.build_invitation(id=123, user=None)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo:
        fake_invitations_repo.get_project_invitation.return_value = None
        pub_invitation = await services.get_public_project_invitation(token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(id=invitation.id)
        assert pub_invitation is None


#######################################################
# get_paginated_project_invitations
#######################################################


async def test_get_project_invitations_ok_admin():
    invitation = f.build_invitation()
    role_admin = f.build_role(is_admin=True)

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
    ):
        fake_invitations_repo.get_project_invitations.return_value = [invitation]
        fake_roles_repo.get_role_for_user.return_value = role_admin

        pagination, invitations = await services.get_paginated_project_invitations(
            project=invitation.project, user=invitation.project.owner, offset=0, limit=10
        )

        fake_invitations_repo.get_project_invitations.assert_awaited_once_with(
            project_slug=invitation.project.slug,
            status=InvitationStatus.PENDING,
            offset=pagination.offset,
            limit=pagination.limit,
        )
        fake_invitations_repo.get_total_project_invitations.assert_awaited_once_with(
            project_slug=invitation.project.slug, status=InvitationStatus.PENDING
        )
        assert invitations == [invitation]


async def test_get_project_invitations_ok_not_admin():
    invitation = f.build_invitation(id=123)
    not_admin_role = f.build_role(is_admin=False)

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
    ):
        fake_invitations_repo.get_project_invitations.return_value = [invitation]
        fake_roles_repo.get_role_for_user.return_value = not_admin_role

        pagination, invitations = await services.get_paginated_project_invitations(
            project=invitation.project, user=invitation.user, offset=0, limit=10
        )

        fake_invitations_repo.get_project_invitations.assert_awaited_once_with(
            project_slug=invitation.project.slug,
            user=invitation.user,
            status=InvitationStatus.PENDING,
            offset=pagination.offset,
            limit=pagination.limit,
        )

        assert invitations == [invitation]


#######################################################
# get_project_invitation_by_user
#######################################################


async def get_project_invitation_by_user_ok():
    invitation = f.build_invitation()

    with (patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo):
        fake_invitations_repo.get_project_invitation_by_user.return_value = invitation

        ret_invitation = await services.get_project_invitation_by_user(
            project_slug=invitation.project.slug, user=invitation.user
        )

        fake_invitations_repo.get_project_invitation_by_user.assert_awaited_once_with(
            project_slug=invitation.project.slug, user=invitation.user
        )
        assert ret_invitation == invitation


#######################################################
# send_project_invitation_email
#######################################################


async def test_send_project_invitations_for_existing_user(tqmanager):
    user1 = f.build_user()
    user2 = f.build_user(email="user-test@email.com")
    project = f.build_project(owner=user1)
    role = f.build_role(project=project, slug="admin")

    invitation = f.build_invitation(id=101, user=user2, project=project, role=role, email=user2.email, invited_by=user1)

    with patch("taiga.invitations.services.ProjectInvitationToken", autospec=True) as FakeProjectInvitationToken:
        FakeProjectInvitationToken.create_for_object.return_value = "invitation-token"

        await services.send_project_invitation_email(invitation=invitation)

        assert len(tqmanager.pending_jobs) == 1

        job = tqmanager.pending_jobs[0]
        assert "send_email" in job["task_name"]

        args = job["args"]
        assert args["email_name"] == "project_invitation"
        assert args["to"] == invitation.email
        assert args["context"]["invitation_token"] == "invitation-token"
        assert args["context"]["project_color"] == invitation.project.color
        assert args["context"]["project_workspace"] == invitation.project.workspace.name
        assert args["context"]["project_image_url"] is None
        assert args["context"]["project_name"] == invitation.project.name
        assert args["context"]["project_slug"] == invitation.project.slug
        assert args["context"]["receiver_name"] == invitation.user.full_name
        assert args["context"]["sender_name"] == invitation.invited_by.full_name


async def test_send_project_invitations_for_new_user(tqmanager):
    user = f.build_user()
    project = f.build_project(owner=user)
    role = f.build_role(project=project, slug="general")

    invitation = f.build_invitation(
        id=102, user=None, project=project, role=role, email="test@email.com", invited_by=user
    )

    with patch("taiga.invitations.services.ProjectInvitationToken", autospec=True) as FakeProjectInvitationToken:
        FakeProjectInvitationToken.create_for_object.return_value = "invitation-token"

        await services.send_project_invitation_email(invitation=invitation)

        assert len(tqmanager.pending_jobs) == 1

        job = tqmanager.pending_jobs[0]
        assert "send_email" in job["task_name"]

        args = job["args"]
        assert args["email_name"] == "project_invitation"
        assert args["to"] == invitation.email
        assert args["context"]["invitation_token"] == "invitation-token"
        assert args["context"]["project_color"] == invitation.project.color
        assert args["context"]["project_workspace"] == invitation.project.workspace.name
        assert args["context"]["project_image_url"] is None
        assert args["context"]["project_name"] == invitation.project.name
        assert args["context"]["project_slug"] == invitation.project.slug
        assert args["context"]["receiver_name"] is None
        assert args["context"]["sender_name"] == invitation.invited_by.full_name


#######################################################
# create_invitations
#######################################################


async def test_create_invitations_non_existing_role(tqmanager):
    user = f.build_user()
    project = f.build_project(owner=user)
    role = f.build_role(project=project, slug="role")
    invitations = [{"email": "test@email.com", "role_slug": "non_existing_role"}]

    with (
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_roles_repo.get_project_roles_as_dict.return_value = {role.slug: role}

        with pytest.raises(ex.NonExistingRoleError):
            await services.create_invitations(project=project, invitations=invitations, invited_by=user)

        assert len(tqmanager.pending_jobs) == 0
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_not_awaited()


async def test_create_invitations_already_member(tqmanager):
    user = f.build_user()
    user2 = f.build_user()
    project = f.build_project(owner=user)
    role = f.build_role(project=project, slug="general")
    invitations = [{"email": user2.email, "role_slug": role.slug}]

    with (
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_roles_repo.get_project_roles_as_dict.return_value = {role.slug: role}
        fake_users_repo.get_users_by_emails_as_dict.return_value = {user2.email: user2}
        fake_users_repo.get_users_by_usernames_as_dict.return_value = {}
        fake_roles_repo.get_project_members.return_value = [user2]

        await services.create_invitations(project=project, invitations=invitations, invited_by=user)

        fake_invitations_repo.create_invitations.assert_not_awaited()

        assert len(tqmanager.pending_jobs) == 0
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_not_awaited()


async def test_create_invitations_with_pending_invitations(tqmanager):
    project = f.build_project()
    user = project.owner
    role = f.build_role(project=project, slug="admin")
    role2 = f.build_role(project=project, slug="general")
    invitation = f.build_invitation(user=None, project=project, role=role, email="test@email.com", invited_by=user)
    invitations = [{"email": invitation.email, "role_slug": role2.slug}]

    with (
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_roles_repo.get_project_roles_as_dict.return_value = {role2.slug: role2}
        fake_invitations_repo.get_project_invitation_by_email.return_value = invitation
        fake_users_repo.get_users_by_emails_as_dict.return_value = {}

        await services.create_invitations(project=project, invitations=invitations, invited_by=user)

        fake_invitations_repo.update_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 1
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_awaited_once()


async def test_create_invitations_by_emails(tqmanager):
    user1 = f.build_user()
    user2 = f.build_user(email="user-test@email.com")
    project = f.build_project()
    role1 = f.build_role(project=project, slug="admin")
    role2 = f.build_role(project=project, slug="general")

    invitations = [
        {"email": user2.email, "role_slug": role1.slug},
        {"email": "test@email.com", "role_slug": role2.slug},
    ]

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_roles_repo.get_project_roles_as_dict.return_value = {role1.slug: role1, role2.slug: role2}
        fake_users_repo.get_users_by_emails_as_dict.return_value = {user2.email: user2}
        fake_users_repo.get_users_by_usernames_as_dict.return_value = {}
        fake_invitations_repo.get_project_invitation_by_email.return_value = None

        await services.create_invitations(project=project, invitations=invitations, invited_by=user1)

        fake_roles_repo.get_project_roles_as_dict.assert_awaited_once_with(project=project)
        fake_users_repo.get_users_by_emails_as_dict.assert_awaited_once_with(emails=[user2.email, "test@email.com"])
        fake_invitations_repo.create_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 2
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_awaited_once()


async def test_create_invitations_by_usernames(tqmanager):
    user1 = f.build_user()
    user2 = f.build_user()
    user3 = f.build_user()
    project = f.build_project()
    role1 = f.build_role(project=project, slug="admin")
    role2 = f.build_role(project=project, slug="general")

    invitations = [
        {"username": user2.username, "role_slug": role1.slug},
        {"username": user3.username, "role_slug": role2.slug},
    ]

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_roles_repo.get_project_roles_as_dict.return_value = {role1.slug: role1, role2.slug: role2}
        fake_users_repo.get_first_user.side_effect = [user2, user3]
        fake_users_repo.get_users_by_usernames_as_dict.return_value = {user2.username: user2, user3.username: user3}
        fake_users_repo.get_users_by_emails_as_dict.return_value = {}
        fake_invitations_repo.get_project_invitation_by_email.return_value = None

        await services.create_invitations(project=project, invitations=invitations, invited_by=user1)

        fake_roles_repo.get_project_roles_as_dict.assert_awaited_once_with(project=project)
        fake_invitations_repo.create_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 2
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_awaited_once()


async def test_create_invitations_duplicated_email_username(tqmanager):
    user1 = f.build_user(email="test1@email.com", username="user1")
    user2 = f.build_user(email="test2@email.com", username="user2")
    user3 = f.build_user(email="test3@email.com", username="user3")
    user4 = f.build_user(email="test4@email.com", username="user4")
    project = f.build_project()
    role1 = f.build_role(project=project, slug="admin")
    role2 = f.build_role(project=project, slug="general")

    invitations = [
        {"username": user2.username, "email": "test2@email.com", "role_slug": role2.slug},
        {"username": user3.username, "role_slug": role2.slug},
        {"username": user4.username, "role_slug": role1.slug},
        {"email": "test3@email.com", "role_slug": role1.slug},
        {"email": "test4@email.com", "role_slug": role2.slug},
    ]

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_roles_repo.get_project_roles_as_dict.return_value = {role1.slug: role1, role2.slug: role2}
        fake_users_repo.get_first_user.side_effect = [user2, user3, user4]
        fake_users_repo.get_users_by_usernames_as_dict.return_value = {
            user2.username: user2,
            user3.username: user3,
            user4.username: user4,
        }
        fake_users_repo.get_users_by_emails_as_dict.return_value = {user3.email: user3, user4.email: user4}
        fake_invitations_repo.get_project_invitation_by_email.return_value = None

        await services.create_invitations(project=project, invitations=invitations, invited_by=user1)

        fake_roles_repo.get_project_roles_as_dict.assert_awaited_once_with(project=project)
        fake_users_repo.get_users_by_emails_as_dict.assert_awaited_once_with(emails=[user3.email, user4.email])
        fake_invitations_repo.create_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 3
        assert list(map(lambda x: x["args"]["to"], tqmanager.pending_jobs)) == [user3.email, user4.email, user2.email]
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_awaited_once()


async def test_create_invitations_invalid_username(tqmanager):
    user1 = f.build_user(email="test@email.com", username="user1")
    project = f.build_project()
    role = f.build_role(project=project, slug="admin")

    invitations = [{"username": "not existing username", "role_slug": role.slug}]

    with (
        patch("taiga.invitations.services.users_repositories.get_first_user", autospec=True) as fake_get_first_user,
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.users_repositories", autospec=True) as fake_users_repo,
        pytest.raises(NonExistingUsernameError),
    ):
        fake_get_first_user.return_value = None
        fake_roles_repo.get_project_roles_as_dict.return_value = {role.slug: role}
        fake_users_repo.get_users_by_usernames_as_dict.return_value = {}
        fake_users_repo.get_users_by_emails_as_dict.return_value = {}

        await services.create_invitations(project=project, invitations=invitations, invited_by=user1)


#######################################################
# accept_project_invitation
#######################################################


async def tests_accept_project_invitation() -> None:
    user = f.build_user()
    project = f.build_project()
    role = f.build_role(project=project)
    invitation = f.build_invitation(project=project, role=role, user=user)

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_invitations_repo.accept_project_invitation.return_value = invitation

        await services.accept_project_invitation(invitation=invitation, user=user)

        fake_invitations_repo.accept_project_invitation.assert_awaited_once_with(invitation=invitation, user=user)
        fake_roles_repo.create_membership.assert_awaited_once_with(project=project, role=role, user=user)
        fake_invitations_events.emit_event_when_project_invitations_is_accepted.assert_awaited_once_with(
            invitation=invitation
        )


async def tests_accept_project_invitation_error_invitation_has_already_been_accepted() -> None:
    user = f.build_user()
    project = f.build_project()
    role = f.build_role(project=project)
    invitation = f.build_invitation(project=project, role=role, user=user, status=InvitationStatus.ACCEPTED)

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.InvitationAlreadyAcceptedError),
    ):
        await services.accept_project_invitation(invitation=invitation, user=user)

        fake_invitations_repo.accept_project_invitation.assert_not_awaited()
        fake_roles_repo.create_membership.assert_not_awaited()
        fake_invitations_events.emit_event_when_project_invitations_is_accepted.assert_not_awaited()


#######################################################
# accept_project_invitation_from_token
#######################################################


async def tests_accept_project_invitation_from_token_ok() -> None:
    user = f.build_user(id=2)
    invitation = f.build_invitation(user=user)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch("taiga.invitations.services.get_project_invitation", autospec=True) as fake_get_project_invitation,
        patch("taiga.invitations.services.accept_project_invitation", autospec=True) as fake_accept_project_invitation,
    ):
        fake_get_project_invitation.return_value = invitation
        fake_accept_project_invitation.return_value = invitation

        await services.accept_project_invitation_from_token(token=token, user=user)

        fake_get_project_invitation.assert_awaited_once_with(token=token)
        fake_accept_project_invitation.assert_awaited_once_with(invitation=invitation, user=user)


async def tests_accept_project_invitation_from_token_error_no_invitation_found() -> None:
    user = f.build_user(id=2)

    with (
        patch("taiga.invitations.services.get_project_invitation", autospec=True) as fake_get_project_invitation,
        patch("taiga.invitations.services.accept_project_invitation", autospec=True) as fake_accept_project_invitation,
        pytest.raises(ex.InvitationDoesNotExistError),
    ):
        fake_get_project_invitation.return_value = None

        await services.accept_project_invitation_from_token(token="some_token", user=user)

        fake_get_project_invitation.assert_awaited_once_with(token="some_token")
        fake_accept_project_invitation.assert_not_awaited()


async def tests_accept_project_invitation_from_token_error_invitation_is_for_other_user() -> None:
    user = f.build_user(id=2)
    other_user = f.build_user(id=3)
    invitation = f.build_invitation(user=other_user)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch("taiga.invitations.services.get_project_invitation", autospec=True) as fake_get_project_invitation,
        patch("taiga.invitations.services.accept_project_invitation", autospec=True) as fake_accept_project_invitation,
        pytest.raises(ex.InvitationIsNotForThisUserError),
    ):
        fake_get_project_invitation.return_value = invitation

        await services.accept_project_invitation_from_token(token=token, user=user)

        fake_get_project_invitation.assert_awaited_once_with(token=token)
        fake_accept_project_invitation.assert_not_awaited()


#######################################################
# is_project_invitation_for_this_user
#######################################################


def test_is_project_invitation_for_this_user_ok_same_user() -> None:
    user = f.build_user(id=2)
    invitation = f.build_invitation(user=user)

    assert services.is_project_invitation_for_this_user(invitation=invitation, user=user)


def test_is_project_invitation_for_this_user_ok_same_email() -> None:
    user = f.build_user(id=2)
    invitation = f.build_invitation(email=user.email, user=None)

    assert services.is_project_invitation_for_this_user(invitation=invitation, user=user)


def test_is_project_invitation_for_this_user_error_different_user() -> None:
    user = f.build_user(id=2)
    other_user = f.build_user(id=3)
    invitation = f.build_invitation(user=other_user)

    assert not services.is_project_invitation_for_this_user(invitation=invitation, user=user)


def test_is_project_invitation_for_this_user_ok_different_email() -> None:
    user = f.build_user(id=2)
    other_user = f.build_user(id=3)
    invitation = f.build_invitation(email=other_user.email, user=None)

    assert not services.is_project_invitation_for_this_user(invitation=invitation, user=user)
