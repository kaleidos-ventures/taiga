# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.invitations import exceptions as ex
from taiga.invitations import services
from taiga.invitations.tokens import ProjectInvitationToken
from taiga.roles import exceptions as roles_ex
from tests.utils import factories as f

#######################################################
# get_public_project_invitation
#######################################################


async def test_get_public_project_invitation_ok():
    invitation = f.build_invitation(id=123)
    token = await ProjectInvitationToken.create_for_object(invitation)

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.users_repositories", autospec=True) as fake_users_repo,
    ):
        fake_invitations_repo.get_project_invitation.return_value = invitation
        fake_users_repo.get_user_by_username_or_email.return_value = invitation.user
        pub_invitation = await services.get_public_project_invitation(str(token))
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(id=invitation.id)
        assert pub_invitation.status == invitation.status
        assert pub_invitation.email == invitation.email
        assert pub_invitation.existing_user is True
        assert pub_invitation.project == invitation.project


async def test_get_public_project_invitation_ok_without_user():
    invitation = f.build_invitation(id=123, user=None)
    token = await ProjectInvitationToken.create_for_object(invitation)

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.users_repositories", autospec=True) as fake_users_repo,
    ):
        fake_invitations_repo.get_project_invitation.return_value = invitation
        fake_users_repo.get_user_by_username_or_email.return_value = None
        pub_invitation = await services.get_public_project_invitation(str(token))
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(id=invitation.id)
        assert pub_invitation.status == invitation.status
        assert pub_invitation.email == invitation.email
        assert pub_invitation.existing_user is False
        assert pub_invitation.project == invitation.project


async def test_get_public_project_invitation_error_invalid_token():
    with pytest.raises(ex.BadInvitationTokenError):
        await services.get_public_project_invitation("invalid-token")


async def test_get_public_project_invitation_error_invitation_not_exists():
    invitation = f.build_invitation(id=123, user=None)
    token = await ProjectInvitationToken.create_for_object(invitation)

    with patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo:
        fake_invitations_repo.get_project_invitation.return_value = None
        pub_invitation = await services.get_public_project_invitation(str(token))
        fake_invitations_repo.get_project_invitation.assert_awaited_once_with(id=invitation.id)
        assert pub_invitation is None


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
        assert args["context"]["project_description"] == invitation.project.description
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
        assert args["context"]["project_description"] == invitation.project.description
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

    with patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo:
        fake_roles_repo.get_project_roles_as_dict.return_value = {role.slug: role}

        with pytest.raises(roles_ex.NonExistingRoleError):
            await services.create_invitations(project=project, invitations=invitations, invited_by=user)

        assert len(tqmanager.pending_jobs) == 0


async def test_create_invitations(tqmanager):
    user1 = f.build_user()
    user2 = f.build_user(email="user-test@email.com")
    project = f.build_project(owner=user1)
    role1 = f.build_role(project=project, slug="admin")
    role2 = f.build_role(project=project, slug="general")

    invitation1 = f.build_invitation(
        id=101, user=user2, project=project, role=role1, email=user2.email, invited_by=user1
    )

    invitation2 = f.build_invitation(
        id=102, user=None, project=project, role=role2, email="test@email.com", invited_by=user1
    )

    invitations = [
        {"email": invitation1.email, "role_slug": invitation1.role.slug},
        {"email": invitation2.email, "role_slug": invitation2.role.slug},
    ]

    with (
        patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo,
        patch("taiga.invitations.services.roles_repositories", autospec=True) as fake_roles_repo,
        patch("taiga.invitations.services.users_repositories", autospec=True) as fake_users_repo,
    ):
        fake_roles_repo.get_project_roles_as_dict.return_value = {role1.slug: role1, role2.slug: role2}
        fake_users_repo.get_users_by_emails_as_dict.return_value = {user2.email: user2}
        fake_invitations_repo.create_invitations.return_value = [invitation1, invitation2]

        await services.create_invitations(project=project, invitations=invitations, invited_by=user1)

        fake_roles_repo.get_project_roles_as_dict.assert_awaited_once_with(project=project)
        fake_users_repo.get_users_by_emails_as_dict.assert_awaited_once_with(
            emails=[invitation1.email, invitation2.email]
        )
        fake_invitations_repo.create_invitations.assert_awaited_once()

        inv1 = fake_invitations_repo.create_invitations.await_args[1]["objs"][0]
        assert inv1.user == invitation1.user
        assert inv1.project == invitation1.project
        assert inv1.role == invitation1.role
        assert inv1.email == invitation1.email
        assert inv1.invited_by == invitation1.invited_by

        inv2 = fake_invitations_repo.create_invitations.await_args[1]["objs"][1]
        assert inv2.user == invitation2.user
        assert inv2.project == invitation2.project
        assert inv2.role == invitation2.role
        assert inv2.email == invitation2.email
        assert inv2.invited_by == invitation2.invited_by

        assert len(tqmanager.pending_jobs) == 2


#######################################################
# get_project_invitations
#######################################################

async def test_get_project_invitations():
    project = f.build_project()
    with patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo:
        await services.get_project_invitations(project=project)

        fake_invitations_repo.get_project_invitations.assert_awaited_once()
