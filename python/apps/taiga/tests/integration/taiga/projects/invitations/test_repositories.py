# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import uuid

import pytest
from asgiref.sync import sync_to_async
from taiga.projects.invitations import repositories
from taiga.projects.invitations.choices import ProjectInvitationStatus
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_project_invitation
##########################################################


async def test_get_project_invitation_ok() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation(invitation.id)

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_not_found() -> None:
    new_invitation = await repositories.get_project_invitation(1001)

    assert new_invitation is None


##########################################################
# get_project_invitation_by_username_or_email
##########################################################


async def test_get_project_invitation_by_user_username() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation_by_username_or_email(
        project_slug=invitation.project.slug,
        username_or_email=invitation.user.username,
        statuses=[ProjectInvitationStatus.PENDING],
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_by_user_email() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation_by_username_or_email(
        project_slug=invitation.project.slug,
        username_or_email=invitation.user.email,
        statuses=[ProjectInvitationStatus.PENDING],
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_by_email() -> None:
    invitation = await f.create_project_invitation(user=None)

    new_invitation = await repositories.get_project_invitation_by_username_or_email(
        project_slug=invitation.project.slug,
        username_or_email=invitation.email,
        statuses=[ProjectInvitationStatus.PENDING],
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_by_email_no_status() -> None:
    invitation = await f.create_project_invitation(user=None)

    new_invitation = await repositories.get_project_invitation_by_username_or_email(
        project_slug=invitation.project.slug, username_or_email=invitation.email
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def get_project_invitation_by_username_or_email_not_found() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation_by_username_or_email(
        project_slug=invitation.project.slug,
        username_or_email="email@email.com",
        statuses=[ProjectInvitationStatus.PENDING],
    )

    assert new_invitation is None


##########################################################
# get_project_invitation_by_id
##########################################################


async def test_get_project_invitation_by_id() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation_by_id(
        project_slug=invitation.project.slug, id=invitation.id
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def get_project_invitation_by_id_not_found() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation_by_id(
        project_slug=invitation.project.slug, id=uuid.uuid1()
    )

    assert new_invitation is None


##########################################################
# get_project_invitations
##########################################################


async def test_get_project_invitations_all_pending_users():
    project = await f.create_project()
    general_role = await sync_to_async(project.roles.get)(slug="general")
    email_a = "a@user.com"
    email_b = "b@user.com"
    email_x = "x@notauser.com"
    email_y = "y@notauser.com"
    email_z = "z@notauser.com"

    user_a = await f.create_user(full_name="A", email=email_b)
    await f.create_project_invitation(
        email=email_b, user=user_a, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    user_b = await f.create_user(full_name="B", email=email_a)
    await f.create_project_invitation(
        email=email_a, user=user_b, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    await f.create_project_invitation(
        email=email_z, user=None, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    await f.create_project_invitation(
        email=email_x, user=None, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    await f.create_project_invitation(
        email=email_y, user=None, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    user = await f.create_user()
    await f.create_project_invitation(
        email=user.email, user=user, project=project, role=general_role, status=ProjectInvitationStatus.ACCEPTED
    )

    response = await repositories.get_project_invitations(
        project_slug=project.slug, status=ProjectInvitationStatus.PENDING, offset=0, limit=100
    )
    assert len(response) == 5
    assert response[0].email == user_a.email
    assert response[1].email == user_b.email
    assert response[2].email == email_x
    assert response[3].email == email_y
    assert response[4].email == email_z


async def test_get_project_invitations_single_pending_user():
    project = await f.create_project()
    general_role = await sync_to_async(project.roles.get)(slug="general")

    user1 = await f.create_user(full_name="AAA")
    await f.create_project_invitation(
        email=user1.email, user=user1, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    await f.create_project_invitation(
        email="non-existing@email.com",
        user=None,
        project=project,
        role=general_role,
        status=ProjectInvitationStatus.PENDING,
    )

    response = await repositories.get_project_invitations(
        project_slug=project.slug, user=user1, status=ProjectInvitationStatus.PENDING, offset=0, limit=100
    )
    assert len(response) == 1
    assert response[0].email == user1.email


async def test_get_project_invitations_single_pending_inactive_user():
    project = await f.create_project()
    general_role = await sync_to_async(project.roles.get)(slug="general")

    user1 = await f.create_user(full_name="AAA")
    await f.create_project_invitation(
        email=user1.email, user=user1, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )
    inactive_user = await f.create_user(is_active=False, email="non-existing@email.com")

    await f.create_project_invitation(
        email=inactive_user.email, user=None, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )

    response = await repositories.get_project_invitations(
        project_slug=project.slug, user=inactive_user, status=ProjectInvitationStatus.PENDING, offset=0, limit=100
    )
    assert len(response) == 1
    assert response[0].email == inactive_user.email


async def test_get_project_invitations_all_accepted_users():
    project = await f.create_project()
    general_role = await sync_to_async(project.roles.get)(slug="general")

    user1 = await f.create_user(full_name="AAA")
    await f.create_project_invitation(
        email=user1.email, user=user1, project=project, role=general_role, status=ProjectInvitationStatus.ACCEPTED
    )
    user2 = await f.create_user(full_name="BBB")
    await f.create_project_invitation(
        email=user2.email, user=user2, project=project, role=general_role, status=ProjectInvitationStatus.ACCEPTED
    )

    response = await repositories.get_project_invitations(
        project_slug=project.slug, status=ProjectInvitationStatus.ACCEPTED, offset=0, limit=100
    )
    assert len(response) == 2
    assert response[0].email == user1.email
    assert response[1].email == user2.email


##########################################################
# get_total_project_invitations
##########################################################


async def test_get_total_project_invitations():
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

    response = await repositories.get_total_project_invitations(
        project_slug=project.slug, status=ProjectInvitationStatus.PENDING
    )
    assert response == 3


##########################################################
# accept_project_invitation
##########################################################


async def tests_accept_project_invitation() -> None:
    user = await f.create_user()
    invitation = await f.create_project_invitation(user=user)

    accepted_invitation = await repositories.accept_project_invitation(invitation=invitation)

    assert accepted_invitation.status == ProjectInvitationStatus.ACCEPTED


##########################################################
# create_project_invitations
##########################################################


async def test_create_project_invitations():
    user = await f.create_user()
    user2 = await f.create_user()
    project = await f.create_project()
    role = await f.create_project_role(project=project)
    role2 = await f.create_project_role(project=project)
    objs = [
        f.build_project_invitation(
            user=user2,
            project=project,
            role=role,
            email=user2.email,
            invited_by=user,
        ),
        f.build_project_invitation(
            user=None,
            project=project,
            role=role2,
            email="test@email.com",
            invited_by=user,
        ),
    ]

    response = await repositories.create_project_invitations(objs=objs)

    assert len(response) == 2


##########################################################
# update_project_invitations
##########################################################


async def test_update_project_invitations():
    invitation1 = await f.create_project_invitation()
    invitation2 = await f.create_project_invitation()
    role1 = await f.create_project_role(project=invitation1.project)
    role2 = await f.create_project_role(project=invitation2.project)
    invitation1.role = role1
    invitation2.role = role2

    objs = [invitation1, invitation2]

    await repositories.update_project_invitations(objs=objs)

    updated_invitation1 = await repositories.get_project_invitation(invitation1.id)
    assert updated_invitation1.role == role1

    updated_invitation2 = await repositories.get_project_invitation(invitation2.id)
    assert updated_invitation2.role == role2


##########################################################
# has_pending_project_invitation_for_user
##########################################################


async def test_has_pending_project_invitation_for_user_exists_for_user():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_project_invitation(status=ProjectInvitationStatus.PENDING, project=project, user=user)

    assert await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_exists_for_email():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_project_invitation(
        status=ProjectInvitationStatus.PENDING, project=project, user=None, email=user.email
    )

    assert await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_does_not_exists_with_invilid_user():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_project_invitation(
        status=ProjectInvitationStatus.PENDING,
        project=project,
        user=await f.create_user(),
    )

    assert not await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_does_not_exists_with_invalid_email():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_project_invitation(
        status=ProjectInvitationStatus.PENDING, project=project, user=None, email="invalid@email.com"
    )

    assert not await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_does_not_exists_with_invalid_project():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_project_invitation(
        status=ProjectInvitationStatus.PENDING,
        user=user,
    )

    assert not await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_does_not_exists_because_is_not_pending():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_project_invitation(status=ProjectInvitationStatus.ACCEPTED, project=project, user=user)

    assert not await repositories.has_pending_project_invitation_for_user(user=user, project=project)


##########################################################
# resend_project_invitation
##########################################################


@sync_to_async
def _get_admin_role(project):
    return project.roles.get(slug="admin")


async def test_resend_project_invitation():
    project = await f.create_project()
    user = await f.create_user()
    invitation = await f.create_project_invitation(
        user=user, email=user.email, project=project, invited_by=project.owner
    )

    other_admin = await f.create_user()
    admin_role = await _get_admin_role(project=project)
    await f.create_project_membership(user=other_admin, project=project, role=admin_role)

    resend_invitation = await repositories.resend_project_invitation(invitation=invitation, resent_by=other_admin)

    assert resend_invitation.user == user
    assert resend_invitation.invited_by == project.owner
    assert resend_invitation.resent_by == other_admin
    assert resend_invitation.resent_at is not None


##########################################################
# revoke_project_invitation
##########################################################


async def test_revoke_project_invitation() -> None:
    user = await f.create_user()
    project = await f.create_project()
    invitation = await f.create_project_invitation(
        user=user, email=user.email, project=project, status=ProjectInvitationStatus.PENDING
    )

    revoked_invitation = await repositories.revoke_project_invitation(invitation=invitation, revoked_by=project.owner)

    assert revoked_invitation.user == user
    assert revoked_invitation.status == ProjectInvitationStatus.REVOKED
    assert revoked_invitation.revoked_by == project.owner


##########################################################
# update_project_invitation
##########################################################


async def test_update_project_invitation_role():
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    invitation = await f.create_project_invitation(
        user=user, email=user.email, project=project, status=ProjectInvitationStatus.PENDING
    )

    new_role = await f.create_project_role(project=project)
    updated_invitation = await repositories.update_project_invitation(invitation=invitation, role=new_role)
    assert updated_invitation.role == new_role