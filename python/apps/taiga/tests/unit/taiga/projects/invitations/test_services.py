# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from datetime import timedelta
from unittest.mock import patch

import pytest
from taiga.base.utils.datetime import aware_utcnow
from taiga.projects.invitations import services
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.invitations.services import exceptions as ex
from taiga.projects.invitations.services.exceptions import NonExistingUsernameError
from taiga.projects.invitations.tokens import ProjectInvitationToken
from tests.utils import factories as f

pytestmark = pytest.mark.django_db

#######################################################
# get_project_invitation
#######################################################


async def test_get_project_invitation_ok():
    invitation = f.build_project_invitation()
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
    ):
        fake_invitations_repo.get_project_invitation.return_value = invitation
        inv = await services.get_project_invitation(token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "project", "workspace", "role"],
        )
        assert inv == invitation


async def test_get_project_invitation_error_invalid_token():
    with pytest.raises(ex.BadInvitationTokenError):
        await services.get_project_invitation("invalid-token")


async def test_get_project_invitation_error_not_found():
    invitation = f.build_project_invitation()
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
    ):
        fake_invitations_repo.get_project_invitation.return_value = None
        inv = await services.get_project_invitation(token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "project", "workspace", "role"],
        )
        assert inv is None


#######################################################
# get_public_project_invitation
#######################################################


async def test_get_public_project_invitation_ok():
    invitation = f.build_project_invitation()
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
    ):
        fake_invitations_repo.get_project_invitation.return_value = invitation
        pub_invitation = await services.get_public_project_invitation(token=token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "project", "workspace", "role"],
        )
        assert pub_invitation.email == invitation.email
        assert pub_invitation.existing_user is True
        assert pub_invitation.project == invitation.project


async def test_get_public_project_invitation_ok_without_user():
    invitation = f.build_project_invitation(user=None)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
    ):
        fake_invitations_repo.get_project_invitation.return_value = invitation
        pub_invitation = await services.get_public_project_invitation(token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "project", "workspace", "role"],
        )
        assert pub_invitation.email == invitation.email
        assert pub_invitation.existing_user is False
        assert pub_invitation.project == invitation.project


async def test_get_public_project_invitation_error_invitation_not_exists():
    invitation = f.build_project_invitation(user=None)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo:
        fake_invitations_repo.get_project_invitation.return_value = None
        pub_invitation = await services.get_public_project_invitation(token)
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(
            filters={"id": str(invitation.id)},
            select_related=["user", "project", "workspace", "role"],
        )
        assert pub_invitation is None


#######################################################
# get_paginated_pending_project_invitations
#######################################################


async def test_get_project_invitations_ok_admin():
    invitation = f.build_project_invitation()
    role_admin = f.build_project_role(is_admin=True)

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.pj_roles_repositories", autospec=True) as fake_pj_roles_repo,
    ):
        fake_invitations_repo.get_project_invitations.return_value = [invitation]
        fake_pj_roles_repo.get_project_role.return_value = role_admin

        pagination, invitations = await services.get_paginated_pending_project_invitations(
            project=invitation.project, user=invitation.project.owner, offset=0, limit=10
        )

        fake_invitations_repo.get_project_invitations.assert_awaited_once_with(
            filters={
                "project_slug": invitation.project.slug,
                "status": ProjectInvitationStatus.PENDING,
            },
            offset=pagination.offset,
            limit=pagination.limit,
        )
        fake_invitations_repo.get_total_project_invitations.assert_awaited_once_with(
            filters={
                "project_slug": invitation.project.slug,
                "status": ProjectInvitationStatus.PENDING,
            }
        )
        assert invitations == [invitation]


async def test_get_project_invitations_ok_not_admin():
    invitation = f.build_project_invitation()
    not_admin_role = f.build_project_role(is_admin=False)

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.pj_roles_repositories", autospec=True) as fake_pj_roles_repo,
    ):
        fake_invitations_repo.get_project_invitations.return_value = [invitation]
        fake_pj_roles_repo.get_project_role.return_value = not_admin_role

        pagination, invitations = await services.get_paginated_pending_project_invitations(
            project=invitation.project, user=invitation.user, offset=0, limit=10
        )

        fake_invitations_repo.get_project_invitations.assert_awaited_once_with(
            filters={
                "project_slug": invitation.project.slug,
                "status": ProjectInvitationStatus.PENDING,
                "user": invitation.user,
            },
            offset=pagination.offset,
            limit=pagination.limit,
        )

        assert invitations == [invitation]


#######################################################
# send_project_invitation_email
#######################################################


async def test_send_project_invitations_for_existing_user(tqmanager, correlation_id):
    user1 = f.build_user()
    user2 = f.build_user(email="user-test@email.com")
    project = f.build_project(owner=user1)
    role = f.build_project_role(project=project, slug="admin")

    invitation = f.build_project_invitation(user=user2, project=project, role=role, email=user2.email, invited_by=user1)

    with patch(
        "taiga.projects.invitations.services.ProjectInvitationToken", autospec=True
    ) as FakeProjectInvitationToken:
        FakeProjectInvitationToken.create_for_object.return_value = "invitation-token"

        await services.send_project_invitation_email(invitation=invitation)

        assert len(tqmanager.pending_jobs) == 1

        job = tqmanager.pending_jobs[0]
        assert "send_email" in job["task_name"]

        args = job["args"]
        assert args["email_name"] == "project_invitation"
        assert args["to"] == invitation.email
        assert args["lang"] == invitation.user.lang
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
    role = f.build_project_role(project=project, slug="general")

    invitation = f.build_project_invitation(
        user=None, project=project, role=role, email="test@email.com", invited_by=user
    )

    with patch(
        "taiga.projects.invitations.services.ProjectInvitationToken", autospec=True
    ) as FakeProjectInvitationToken:
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
# create_project_invitations
#######################################################


async def test_create_project_invitations_non_existing_role(tqmanager):
    user = f.build_user()
    project = f.build_project(owner=user)
    role = f.build_project_role(project=project, slug="role")
    invitations = [{"email": "test@email.com", "role_slug": "non_existing_role"}]

    with (
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role.slug: role}

        with pytest.raises(ex.NonExistingRoleError):
            await services.create_project_invitations(project=project, invitations=invitations, invited_by=user)

        assert len(tqmanager.pending_jobs) == 0
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_not_awaited()


async def test_create_project_invitations_already_member(tqmanager):
    user = f.build_user()
    user2 = f.build_user()
    project = f.build_project(owner=user)
    role = f.build_project_role(project=project, slug="general")
    invitations = [{"email": user2.email, "role_slug": role.slug}]

    with (
        patch("taiga.projects.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.memberships_repositories", autospec=True) as fake_memberships_repo,
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role.slug: role}
        fake_users_services.get_users_emails_as_dict.return_value = {user2.email: user2}
        fake_users_services.get_users_usernames_as_dict.return_value = {}
        fake_memberships_repo.get_project_members.return_value = [user2]

        await services.create_project_invitations(project=project, invitations=invitations, invited_by=user)

        fake_invitations_repo.create_project_invitations.assert_not_awaited()
        assert len(tqmanager.pending_jobs) == 0
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_not_awaited()


async def test_create_project_invitations_with_pending_invitations(tqmanager):
    project = f.build_project()
    user = project.owner
    role = f.build_project_role(project=project, slug="admin")
    role2 = f.build_project_role(project=project, slug="general")
    created_at = aware_utcnow() - timedelta(days=1)  # to avoid time spam
    invitation = f.build_project_invitation(
        project=project, user=None, role=role, email="test@email.com", created_at=created_at, invited_by=user
    )
    invitations = [{"email": invitation.email, "role_slug": role2.slug}]

    with (
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role2.slug: role2}
        fake_invitations_repo.get_project_invitation.return_value = invitation
        fake_users_services.get_users_emails_as_dict.return_value = {}
        fake_users_services.get_users_usernames_as_dict.return_value = {}

        await services.create_project_invitations(project=project, invitations=invitations, invited_by=user)

        fake_invitations_repo.bulk_update_project_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 1
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_awaited_once()


async def test_create_project_invitations_with_pending_invitations_time_spam(tqmanager, override_settings):
    project = f.build_project()
    user = project.owner
    role = f.build_project_role(project=project, slug="admin")
    role2 = f.build_project_role(project=project, slug="general")
    invitation = f.build_project_invitation(
        user=None, project=project, role=role, email="test@email.com", invited_by=user
    )
    invitations = [{"email": invitation.email, "role_slug": role2.slug}]

    with (
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        override_settings({"PROJECT_INVITATION_RESEND_TIME": 10}),
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role2.slug: role2}
        fake_invitations_repo.get_project_invitation.return_value = invitation
        fake_users_services.get_users_emails_as_dict.return_value = {}
        fake_users_services.get_users_usernames_as_dict.return_value = {}

        await services.create_project_invitations(project=project, invitations=invitations, invited_by=user)

        fake_invitations_repo.bulk_update_project_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 0
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_not_awaited()


async def test_create_project_invitations_with_revoked_invitations(tqmanager):
    project = f.build_project()
    user = project.owner
    role = f.build_project_role(project=project, slug="admin")
    role2 = f.build_project_role(project=project, slug="general")
    created_at = aware_utcnow() - timedelta(days=1)  # to avoid time spam
    invitation = f.build_project_invitation(
        project=project,
        user=None,
        role=role,
        email="test@email.com",
        created_at=created_at,
        invited_by=user,
        status=ProjectInvitationStatus.REVOKED,
    )
    invitations = [{"email": invitation.email, "role_slug": role2.slug}]

    with (
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role2.slug: role2}
        fake_invitations_repo.get_project_invitation.return_value = invitation
        fake_users_services.get_users_emails_as_dict.return_value = {}
        fake_users_services.get_users_usernames_as_dict.return_value = {}

        await services.create_project_invitations(project=project, invitations=invitations, invited_by=user)

        fake_invitations_repo.bulk_update_project_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 1
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_awaited_once()


async def test_create_project_invitations_with_revoked_invitations_time_spam(tqmanager, override_settings):
    project = f.build_project()
    user = project.owner
    role = f.build_project_role(project=project, slug="admin")
    role2 = f.build_project_role(project=project, slug="general")
    invitation = f.build_project_invitation(
        project=project,
        user=None,
        role=role,
        email="test@email.com",
        invited_by=user,
        status=ProjectInvitationStatus.REVOKED,
    )
    invitations = [{"email": invitation.email, "role_slug": role2.slug}]

    with (
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        override_settings({"PROJECT_INVITATION_RESEND_TIME": 10}),
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role2.slug: role2}
        fake_invitations_repo.get_project_invitation.return_value = invitation
        fake_users_services.get_users_emails_as_dict.return_value = {}
        fake_users_services.get_users_usernames_as_dict.return_value = {}

        await services.create_project_invitations(project=project, invitations=invitations, invited_by=user)

        fake_invitations_repo.bulk_update_project_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 0
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_not_awaited()


async def test_create_project_invitations_by_emails(tqmanager):
    user1 = f.build_user()
    user2 = f.build_user(email="user-test@email.com")
    project = f.build_project()
    role1 = f.build_project_role(project=project, slug="admin")
    role2 = f.build_project_role(project=project, slug="general")

    invitations = [
        {"email": user2.email, "role_slug": role1.slug},
        {"email": "test@email.com", "role_slug": role2.slug},
    ]

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role1.slug: role1, role2.slug: role2}
        fake_users_services.get_users_emails_as_dict.return_value = {user2.email: user2}
        fake_users_services.get_users_usernames_as_dict.return_value = {}
        fake_invitations_repo.get_project_invitation.return_value = None

        await services.create_project_invitations(project=project, invitations=invitations, invited_by=user1)

        fake_pj_roles_services.get_project_roles_as_dict.assert_awaited_once_with(project=project)
        fake_users_services.get_users_emails_as_dict.assert_awaited_once()
        fake_users_services.get_users_usernames_as_dict.assert_not_awaited()
        fake_invitations_repo.create_project_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 2
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_awaited_once()


async def test_create_project_invitations_by_usernames(tqmanager):
    user1 = f.build_user()
    user2 = f.build_user()
    user3 = f.build_user()
    project = f.build_project()
    role1 = f.build_project_role(project=project, slug="admin")
    role2 = f.build_project_role(project=project, slug="general")

    invitations = [
        {"username": user2.username, "role_slug": role1.slug},
        {"username": user3.username, "role_slug": role2.slug},
    ]

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role1.slug: role1, role2.slug: role2}
        fake_users_services.get_users_emails_as_dict.return_value = {}
        fake_users_services.get_users_usernames_as_dict.return_value = {user2.username: user2, user3.username: user3}
        fake_invitations_repo.get_project_invitation.return_value = None

        await services.create_project_invitations(project=project, invitations=invitations, invited_by=user1)

        fake_pj_roles_services.get_project_roles_as_dict.assert_awaited_once_with(project=project)
        fake_invitations_repo.create_project_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 2
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_awaited_once()


async def test_create_project_invitations_duplicated_email_username(tqmanager):
    user1 = f.build_user(email="test1@email.com", username="user1")
    user2 = f.build_user(email="test2@email.com", username="user2")
    user3 = f.build_user(email="test3@email.com", username="user3")
    user4 = f.build_user(email="test4@email.com", username="user4")
    project = f.build_project()
    role1 = f.build_project_role(project=project, slug="admin")
    role2 = f.build_project_role(project=project, slug="general")

    invitations = [
        {"username": user2.username, "email": "test2@email.com", "role_slug": role2.slug},
        {"username": user3.username, "role_slug": role2.slug},
        {"username": user4.username, "role_slug": role1.slug},
        {"email": "test3@email.com", "role_slug": role1.slug},
        {"email": "test4@email.com", "role_slug": role2.slug},
    ]

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role1.slug: role1, role2.slug: role2}
        fake_users_services.get_users_emails_as_dict.return_value = {user3.email: user3, user4.email: user4}
        fake_users_services.get_users_usernames_as_dict.return_value = {
            user2.username: user2,
            user3.username: user3,
            user4.username: user4,
        }
        fake_invitations_repo.get_project_invitation.return_value = None

        await services.create_project_invitations(project=project, invitations=invitations, invited_by=user1)

        fake_pj_roles_services.get_project_roles_as_dict.assert_awaited_once_with(project=project)
        fake_users_services.get_users_emails_as_dict.assert_awaited_once()
        fake_users_services.get_users_usernames_as_dict.assert_awaited_once()
        fake_invitations_repo.create_project_invitations.assert_awaited_once()

        assert len(tqmanager.pending_jobs) == 3
        assert list(map(lambda x: x["args"]["to"], tqmanager.pending_jobs)) == [user3.email, user4.email, user2.email]
        fake_invitations_events.emit_event_when_project_invitations_are_created.assert_awaited_once()


async def test_create_project_invitations_invalid_username(tqmanager):
    user1 = f.build_user(email="test@email.com", username="user1")
    project = f.build_project()
    role = f.build_project_role(project=project, slug="admin")

    invitations = [{"username": "not existing username", "role_slug": role.slug}]

    with (
        patch("taiga.projects.invitations.services.pj_roles_services", autospec=True) as fake_pj_roles_services,
        patch("taiga.projects.invitations.services.users_services", autospec=True) as fake_users_services,
        pytest.raises(NonExistingUsernameError),
    ):
        fake_pj_roles_services.get_project_roles_as_dict.return_value = {role.slug: role}
        fake_users_services.get_users_emails_as_dict.return_value = {}
        fake_users_services.get_users_usernames_as_dict.return_value = {}

        await services.create_project_invitations(project=project, invitations=invitations, invited_by=user1)


#######################################################
# accept_project_invitation
#######################################################


async def tests_accept_project_invitation() -> None:
    user = f.build_user()
    project = f.build_project()
    role = f.build_project_role(project=project)
    invitation = f.build_project_invitation(project=project, role=role, user=user, email=user.email)

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.memberships_repositories", autospec=True) as fake_memberships_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_invitations_repo.update_project_invitation.return_value = invitation
        accepted_invitation = await services.accept_project_invitation(invitation=invitation)

        assert accepted_invitation.status == ProjectInvitationStatus.ACCEPTED
        fake_invitations_repo.update_project_invitation.assert_awaited_once_with(invitation=invitation)
        fake_memberships_repo.create_project_membership.assert_awaited_once_with(project=project, role=role, user=user)
        fake_invitations_events.emit_event_when_project_invitation_is_accepted.assert_awaited_once_with(
            invitation=invitation
        )


async def tests_accept_project_invitation_error_invitation_has_already_been_accepted() -> None:
    user = f.build_user()
    project = f.build_project()
    role = f.build_project_role(project=project)
    invitation = f.build_project_invitation(
        project=project, role=role, user=user, status=ProjectInvitationStatus.ACCEPTED, email=user.email
    )

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.pj_roles_repositories", autospec=True) as fake_pj_roles_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.InvitationAlreadyAcceptedError),
    ):
        await services.accept_project_invitation(invitation=invitation)

        fake_invitations_repo.accept_project_invitation.assert_not_awaited()
        fake_pj_roles_repo.create_project_membership.assert_not_awaited()
        fake_invitations_events.emit_event_when_project_invitation_is_accepted.assert_not_awaited()


async def tests_accept_project_invitation_error_invitation_has_been_revoked() -> None:
    user = f.build_user()
    project = f.build_project()
    role = f.build_project_role(project=project)
    invitation = f.build_project_invitation(
        project=project, role=role, user=user, status=ProjectInvitationStatus.REVOKED, email=user.email
    )

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.pj_roles_repositories", autospec=True) as fake_pj_roles_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.InvitationRevokedError),
    ):
        await services.accept_project_invitation(invitation=invitation)

        fake_invitations_repo.accept_project_invitation.assert_not_awaited()
        fake_pj_roles_repo.create_project_membership.assert_not_awaited()
        fake_invitations_events.emit_event_when_project_invitation_is_accepted.assert_not_awaited()


#######################################################
# accept_project_invitation_from_token
#######################################################


async def tests_accept_project_invitation_from_token_ok() -> None:
    user = f.build_user()
    invitation = f.build_project_invitation(user=user, email=user.email)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch(
            "taiga.projects.invitations.services.get_project_invitation", autospec=True
        ) as fake_get_project_invitation,
        patch(
            "taiga.projects.invitations.services.accept_project_invitation", autospec=True
        ) as fake_accept_project_invitation,
    ):
        fake_get_project_invitation.return_value = invitation

        await services.accept_project_invitation_from_token(token=token, user=user)

        fake_get_project_invitation.assert_awaited_once_with(token=token)
        fake_accept_project_invitation.assert_awaited_once_with(invitation=invitation)


async def tests_accept_project_invitation_from_token_error_no_invitation_found() -> None:
    user = f.build_user()

    with (
        patch(
            "taiga.projects.invitations.services.get_project_invitation", autospec=True
        ) as fake_get_project_invitation,
        patch(
            "taiga.projects.invitations.services.accept_project_invitation", autospec=True
        ) as fake_accept_project_invitation,
        pytest.raises(ex.InvitationDoesNotExistError),
    ):
        fake_get_project_invitation.return_value = None

        await services.accept_project_invitation_from_token(token="some_token", user=user)

        fake_get_project_invitation.assert_awaited_once_with(token="some_token")
        fake_accept_project_invitation.assert_not_awaited()


async def tests_accept_project_invitation_from_token_error_invitation_is_for_other_user() -> None:
    user = f.build_user()
    other_user = f.build_user()
    invitation = f.build_project_invitation(user=other_user, email=other_user.email)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch(
            "taiga.projects.invitations.services.get_project_invitation", autospec=True
        ) as fake_get_project_invitation,
        patch(
            "taiga.projects.invitations.services.accept_project_invitation", autospec=True
        ) as fake_accept_project_invitation,
        pytest.raises(ex.InvitationIsNotForThisUserError),
    ):
        fake_get_project_invitation.return_value = invitation

        await services.accept_project_invitation_from_token(token=token, user=user)

        fake_get_project_invitation.assert_awaited_once_with(token=token)
        fake_accept_project_invitation.assert_not_awaited()


async def tests_accept_project_invitation_from_token_error_already_accepted() -> None:
    user = f.build_user()
    invitation = f.build_project_invitation(user=user, email=user.email, status=ProjectInvitationStatus.ACCEPTED)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch(
            "taiga.projects.invitations.services.get_project_invitation", autospec=True
        ) as fake_get_project_invitation,
        patch(
            "taiga.projects.invitations.services.accept_project_invitation", autospec=True
        ) as fake_accept_project_invitation,
        pytest.raises(ex.InvitationAlreadyAcceptedError),
    ):
        fake_get_project_invitation.return_value = invitation

        await services.accept_project_invitation_from_token(token=token, user=user)

        fake_get_project_invitation.assert_awaited_once_with(token=token)
        fake_accept_project_invitation.assert_not_awaited()


async def tests_accept_project_invitation_from_token_error_revoked() -> None:
    user = f.build_user()
    invitation = f.build_project_invitation(user=user, email=user.email, status=ProjectInvitationStatus.REVOKED)
    token = str(await ProjectInvitationToken.create_for_object(invitation))

    with (
        patch(
            "taiga.projects.invitations.services.get_project_invitation", autospec=True
        ) as fake_get_project_invitation,
        patch(
            "taiga.projects.invitations.services.accept_project_invitation", autospec=True
        ) as fake_accept_project_invitation,
        pytest.raises(ex.InvitationRevokedError),
    ):
        fake_get_project_invitation.return_value = invitation

        await services.accept_project_invitation_from_token(token=token, user=user)

        fake_get_project_invitation.assert_awaited_once_with(token=token)
        fake_accept_project_invitation.assert_not_awaited()


#######################################################
# is_project_invitation_for_this_user
#######################################################


def test_is_project_invitation_for_this_user_ok_same_user() -> None:
    user = f.build_user()
    invitation = f.build_project_invitation(email=user.email, user=user)

    assert services.is_project_invitation_for_this_user(invitation=invitation, user=user)


def test_is_project_invitation_for_this_user_ok_same_email() -> None:
    user = f.build_user()
    invitation = f.build_project_invitation(email=user.email, user=None)

    assert services.is_project_invitation_for_this_user(invitation=invitation, user=user)


def test_is_project_invitation_for_this_user_error_different_user() -> None:
    user = f.build_user()
    other_user = f.build_user()
    invitation = f.build_project_invitation(user=other_user)

    assert not services.is_project_invitation_for_this_user(invitation=invitation, user=user)


def test_is_project_invitation_for_this_user_ok_different_email() -> None:
    user = f.build_user()
    other_user = f.build_user()
    invitation = f.build_project_invitation(email=other_user.email, user=None)

    assert not services.is_project_invitation_for_this_user(invitation=invitation, user=user)


#######################################################
# has_pending_project_invitation_for_user
#######################################################


async def test_has_pending_project_invitation_for_user() -> None:
    user = f.build_user()
    project = f.build_project()

    with (patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_projects_repo,):
        invitation = f.build_project_invitation(email=user.email, user=user, project=project)
        fake_projects_repo.get_project_invitation.return_value = invitation
        res = await services.has_pending_project_invitation_for_user(project=project, user=user)
        assert res is True

        fake_projects_repo.get_project_invitation.return_value = None
        res = await services.has_pending_project_invitation_for_user(project=project, user=user)
        assert res is False


#######################################################
# update_user_projects_invitations
#######################################################


async def test_update_user_projects_invitations() -> None:
    user = f.build_user()
    with (
        patch(
            "taiga.projects.invitations.services.invitations_repositories", autospec=True
        ) as fake_invitations_repositories,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        await services.update_user_projects_invitations(user=user)
        fake_invitations_repositories.update_user_projects_invitations.assert_awaited_once_with(user=user)
        fake_invitations_repositories.get_project_invitations.assert_awaited_once_with(
            filters={"user": user, "status": ProjectInvitationStatus.PENDING},
            select_related=["user", "role", "project", "workspace"],
        )
        fake_invitations_events.emit_event_when_project_invitations_are_updated.assert_awaited_once()


#######################################################
# resend_project_invitation
#######################################################


async def test_resend_project_invitation_by_username_ok() -> None:
    owner = f.build_user()
    project = f.build_project(owner=owner)
    user = f.build_user()
    created_at = aware_utcnow() - timedelta(days=1)  # to avoid time spam
    invitation = f.build_project_invitation(project=project, user=user, email=user.email, created_at=created_at)

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch(
            "taiga.projects.invitations.services.send_project_invitation_email", autospec=True
        ) as fake_send_project_invitation_email,
    ):
        fake_send_project_invitation_email.return_value = None
        fake_invitations_repo.update_project_invitation.return_value = invitation
        await services.resend_project_invitation(invitation=invitation, resent_by=owner)
        fake_invitations_repo.update_project_invitation.assert_awaited_once_with(invitation=invitation)
        fake_send_project_invitation_email.assert_awaited_once_with(invitation=invitation, is_resend=True)


async def test_resend_project_invitation_by_user_email_ok() -> None:
    owner = f.build_user()
    project = f.build_project(owner=owner)
    user = f.build_user()
    created_at = aware_utcnow() - timedelta(days=1)  # to avoid time spam
    invitation = f.build_project_invitation(project=project, user=user, email=user.email, created_at=created_at)

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch(
            "taiga.projects.invitations.services.send_project_invitation_email", autospec=True
        ) as fake_send_project_invitation_email,
    ):
        fake_send_project_invitation_email.return_value = None
        fake_invitations_repo.update_project_invitation.return_value = invitation
        await services.resend_project_invitation(invitation=invitation, resent_by=owner)
        fake_invitations_repo.update_project_invitation.assert_awaited_once_with(invitation=invitation)
        fake_send_project_invitation_email.assert_awaited_once_with(invitation=invitation, is_resend=True)


async def test_resend_project_invitation_by_email_ok() -> None:
    owner = f.build_user()
    project = f.build_project(owner=owner)
    email = "user-test@email.com"
    created_at = aware_utcnow() - timedelta(days=1)  # to avoid time spam
    invitation = f.build_project_invitation(project=project, user=None, email=email, created_at=created_at)

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch(
            "taiga.projects.invitations.services.send_project_invitation_email", autospec=True
        ) as fake_send_project_invitation_email,
    ):
        fake_send_project_invitation_email.return_value = None
        fake_invitations_repo.update_project_invitation.return_value = invitation
        await services.resend_project_invitation(invitation=invitation, resent_by=owner)
        fake_invitations_repo.update_project_invitation.assert_awaited_once_with(invitation=invitation)
        fake_send_project_invitation_email.assert_awaited_once_with(invitation=invitation, is_resend=True)


async def test_resend_project_invitation_already_accepted() -> None:
    owner = f.build_user()
    project = f.build_project(owner=owner)
    email = "user-test@email.com"
    invitation = f.build_project_invitation(
        project=project, user=None, email=email, status=ProjectInvitationStatus.ACCEPTED
    )

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch(
            "taiga.projects.invitations.services.send_project_invitation_email", autospec=True
        ) as fake_send_project_invitation_email,
        pytest.raises(ex.InvitationAlreadyAcceptedError),
    ):
        fake_send_project_invitation_email.return_value = None
        await services.resend_project_invitation(invitation=invitation, resent_by=owner)
        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_send_project_invitation_email.assert_not_awaited()


async def test_resend_project_invitation_revoked() -> None:
    owner = f.build_user()
    project = f.build_project(owner=owner)
    email = "user-test@email.com"
    invitation = f.build_project_invitation(
        project=project, user=None, email=email, status=ProjectInvitationStatus.REVOKED
    )

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch(
            "taiga.projects.invitations.services.send_project_invitation_email", autospec=True
        ) as fake_send_project_invitation_email,
        pytest.raises(ex.InvitationRevokedError),
    ):
        fake_send_project_invitation_email.return_value = None
        await services.resend_project_invitation(invitation=invitation, resent_by=owner)
        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_send_project_invitation_email.assert_not_awaited()


async def test_resend_project_invitation_num_emails_sent_in_limit() -> None:
    owner = f.build_user()
    project = f.build_project(owner=owner)
    email = "user-test@email.com"
    invitation = f.build_project_invitation(project=project, user=None, email=email, num_emails_sent=10)

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch(
            "taiga.projects.invitations.services.send_project_invitation_email", autospec=True
        ) as fake_send_project_invitation_email,
    ):
        await services.resend_project_invitation(invitation=invitation, resent_by=owner)
        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_send_project_invitation_email.assert_not_awaited()


async def test_resend_project_invitation_resent_at_in_limit() -> None:
    owner = f.build_user()
    project = f.build_project(owner=owner)
    email = "user-test@email.com"
    invitation = f.build_project_invitation(project=project, user=None, email=email, resent_at=aware_utcnow())

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch(
            "taiga.projects.invitations.services.send_project_invitation_email", autospec=True
        ) as fake_send_project_invitation_email,
    ):
        await services.resend_project_invitation(invitation=invitation, resent_by=owner)
        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_send_project_invitation_email.assert_not_awaited()


async def test_resend_project_invitation_resent_after_create(override_settings) -> None:
    owner = f.build_user()
    project = f.build_project(owner=owner)
    email = "user-test@email.com"
    invitation = f.build_project_invitation(project=project, user=None, email=email)

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch(
            "taiga.projects.invitations.services.send_project_invitation_email", autospec=True
        ) as fake_send_project_invitation_email,
        override_settings({"PROJECT_INVITATION_RESEND_TIME": 10}),
    ):
        await services.resend_project_invitation(invitation=invitation, resent_by=owner)
        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_send_project_invitation_email.assert_not_awaited()


#######################################################
# revoke_project_invitation
#######################################################


async def test_revoke_project_invitation_ok() -> None:
    project = f.build_project()
    user = f.build_user()
    invitation = f.build_project_invitation(project=project, user=user, email=user.email)

    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_invitations_repo.update_project_invitation.return_value = invitation
        await services.revoke_project_invitation(invitation=invitation, revoked_by=project.owner)
        fake_invitations_repo.update_project_invitation.assert_awaited_once_with(invitation=invitation)
        fake_invitations_events.emit_event_when_project_invitation_is_revoked.assert_awaited_once_with(
            invitation=invitation
        )


async def test_revoke_project_invitation_already_accepted() -> None:
    user = f.build_user()
    project = f.build_project()
    invitation = f.build_project_invitation(
        project=project, user=user, email=user.email, status=ProjectInvitationStatus.ACCEPTED
    )
    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.InvitationAlreadyAcceptedError),
    ):

        await services.revoke_project_invitation(invitation=invitation, revoked_by=project.owner)

        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_invitations_events.emit_event_when_project_invitation_is_revoked.assert_not_awaited()


async def test_revoke_project_invitation_revoked() -> None:
    user = f.build_user()
    project = f.build_project()
    invitation = f.build_project_invitation(
        project=project, user=user, email=user.email, status=ProjectInvitationStatus.REVOKED
    )
    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.InvitationRevokedError),
    ):

        await services.revoke_project_invitation(invitation=invitation, revoked_by=project.owner)

        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_invitations_events.emit_event_when_project_invitation_is_revoked.assert_not_awaited()


#######################################################
# update_project_invitation
#######################################################


async def test_update_project_invitation_role_invitation_accepted() -> None:
    user = f.build_user()
    project = f.build_project()
    general_role = f.build_project_role(project=project, is_admin=False)
    invitation = f.build_project_invitation(
        project=project, user=user, email=user.email, status=ProjectInvitationStatus.ACCEPTED
    )
    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.InvitationAlreadyAcceptedError),
    ):

        await services.update_project_invitation(invitation=invitation, role_slug=general_role)

        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_invitations_events.emit_event_when_project_invitation_is_updated.assert_not_awaited()


async def test_update_project_invitation_role_invitation_revoked() -> None:
    user = f.build_user()
    project = f.build_project()
    general_role = f.build_project_role(project=project, is_admin=False)
    invitation = f.build_project_invitation(
        project=project, user=user, email=user.email, status=ProjectInvitationStatus.REVOKED
    )
    with (
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.InvitationRevokedError),
    ):

        await services.update_project_invitation(invitation=invitation, role_slug=general_role)

        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_invitations_events.emit_event_when_project_invitation_is_updated.assert_not_awaited()


async def test_update_project_invitation_role_non_existing_role():
    project = f.build_project()
    user = f.build_user()
    general_role = f.build_project_role(project=project, is_admin=False)
    invitation = f.build_project_invitation(
        project=project, user=user, email=user.email, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    non_existing_role_slug = "non_existing_role_slug"
    with (
        patch("taiga.projects.invitations.services.pj_roles_repositories", autospec=True) as fake_pj_roles_repo,
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
        pytest.raises(ex.NonExistingRoleError),
    ):
        fake_pj_roles_repo.get_project_role.return_value = None

        await services.update_project_invitation(invitation=invitation, role_slug=non_existing_role_slug)
        fake_pj_roles_repo.get_project_role.assert_awaited_once_with(project=project, slug=non_existing_role_slug)
        fake_invitations_repo.update_project_invitation.assert_not_awaited()
        fake_invitations_events.emit_event_when_project_invitation_is_updated.assert_not_awaited()


async def test_update_project_invitation_role_ok():
    project = f.build_project()
    user = f.build_user()
    general_role = f.build_project_role(project=project, is_admin=False)
    invitation = f.build_project_invitation(
        project=project, user=user, email=user.email, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    admin_role = f.build_project_role(project=project, is_admin=True)
    with (
        patch("taiga.projects.invitations.services.pj_roles_repositories", autospec=True) as fake_pj_roles_repo,
        patch("taiga.projects.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.projects.invitations.services.invitations_events", autospec=True) as fake_invitations_events,
    ):
        fake_pj_roles_repo.get_project_role.return_value = admin_role
        updated_invitation = await services.update_project_invitation(invitation=invitation, role_slug=admin_role.slug)
        fake_pj_roles_repo.get_project_role.assert_awaited_once_with(
            filters={"project_id": project.id, "slug": admin_role.slug}
        )
        fake_invitations_repo.update_project_invitation.assert_awaited_once_with(invitation=invitation)
        fake_invitations_events.emit_event_when_project_invitation_is_updated.assert_awaited_once_with(
            invitation=updated_invitation
        )
