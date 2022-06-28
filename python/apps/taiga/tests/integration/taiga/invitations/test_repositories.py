# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from taiga.invitations import repositories
from taiga.invitations.choices import InvitationStatus
from taiga.invitations.models import Invitation
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_project_invitation
##########################################################


async def test_get_project_invitation_ok() -> None:
    invitation = await f.create_invitation()

    new_invitation = await repositories.get_project_invitation(invitation.id)

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_not_found() -> None:
    new_invitation = await repositories.get_project_invitation(1001)

    assert new_invitation is None


##########################################################
# get_project_invitation_by_email
##########################################################


async def test_get_project_invitation_by_email_ok() -> None:
    invitation = await f.create_invitation()

    new_invitation = await repositories.get_project_invitation_by_email(
        project_slug=invitation.project.slug, email=invitation.email, status=InvitationStatus.PENDING
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_by_email_not_found() -> None:
    invitation = await f.create_invitation()

    new_invitation = await repositories.get_project_invitation_by_email(
        project_slug=invitation.project.slug, email="email@email.com", status=InvitationStatus.PENDING
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
    await f.create_invitation(
        email=email_b, user=user_a, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    user_b = await f.create_user(full_name="B", email=email_a)
    await f.create_invitation(
        email=email_a, user=user_b, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    await f.create_invitation(
        email=email_z, user=None, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    await f.create_invitation(
        email=email_x, user=None, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    await f.create_invitation(
        email=email_y, user=None, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    user = await f.create_user()
    await f.create_invitation(
        email=user.email, user=user, project=project, role=general_role, status=InvitationStatus.ACCEPTED
    )

    response = await repositories.get_project_invitations(
        project_slug=project.slug, status=InvitationStatus.PENDING, offset=0, limit=100
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
    await f.create_invitation(
        email=user1.email, user=user1, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    await f.create_invitation(
        email="non-existing@email.com", user=None, project=project, role=general_role, status=InvitationStatus.PENDING
    )

    response = await repositories.get_project_invitations(
        project_slug=project.slug, user=user1, status=InvitationStatus.PENDING, offset=0, limit=100
    )
    assert len(response) == 1
    assert response[0].email == user1.email


async def test_get_project_invitations_single_pending_inactive_user():
    project = await f.create_project()
    general_role = await sync_to_async(project.roles.get)(slug="general")

    user1 = await f.create_user(full_name="AAA")
    await f.create_invitation(
        email=user1.email, user=user1, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    inactive_user = await f.create_user(is_active=False, email="non-existing@email.com")

    await f.create_invitation(
        email=inactive_user.email, user=None, project=project, role=general_role, status=InvitationStatus.PENDING
    )

    response = await repositories.get_project_invitations(
        project_slug=project.slug, user=inactive_user, status=InvitationStatus.PENDING, offset=0, limit=100
    )
    assert len(response) == 1
    assert response[0].email == inactive_user.email


async def test_get_project_invitations_all_accepted_users():
    project = await f.create_project()
    general_role = await sync_to_async(project.roles.get)(slug="general")

    user1 = await f.create_user(full_name="AAA")
    await f.create_invitation(
        email=user1.email, user=user1, project=project, role=general_role, status=InvitationStatus.ACCEPTED
    )
    user2 = await f.create_user(full_name="BBB")
    await f.create_invitation(
        email=user2.email, user=user2, project=project, role=general_role, status=InvitationStatus.ACCEPTED
    )

    response = await repositories.get_project_invitations(
        project_slug=project.slug, status=InvitationStatus.ACCEPTED, offset=0, limit=100
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
    await f.create_invitation(
        email=user1.email, user=user1, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    user2 = await f.create_user(full_name="BBB")
    await f.create_invitation(
        email=user2.email, user=user2, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    await f.create_invitation(
        email="non-existing@email.com", user=None, project=project, role=general_role, status=InvitationStatus.PENDING
    )
    user = await f.create_user()
    await f.create_invitation(
        email=user.email, user=user, project=project, role=general_role, status=InvitationStatus.ACCEPTED
    )

    response = await repositories.get_total_project_invitations(
        project_slug=project.slug, status=InvitationStatus.PENDING
    )
    assert response == 3


##########################################################
# accept_project_invitation
##########################################################


async def tests_accept_project_invitation() -> None:
    user = await f.create_user()
    invitation = await f.create_invitation(user=None)

    accepted_invitation = await repositories.accept_project_invitation(invitation=invitation, user=user)

    assert accepted_invitation.user == user
    assert accepted_invitation.status == InvitationStatus.ACCEPTED


##########################################################
# create_invitations
##########################################################


async def test_create_invitations():
    user = await f.create_user()
    user2 = await f.create_user()
    project = await f.create_project()
    role = await f.create_role(project=project)
    role2 = await f.create_role(project=project)
    objs = [
        Invitation(
            user=user2,
            project=project,
            role=role,
            email=user2.email,
            invited_by=user,
        ),
        Invitation(
            user=None,
            project=project,
            role=role2,
            email="test@email.com",
            invited_by=user,
        ),
    ]

    response = await repositories.create_invitations(objs=objs)

    assert len(response) == 2


##########################################################
# update_invitations
##########################################################


async def test_update_invitations():
    invitation1 = await f.create_invitation()
    invitation2 = await f.create_invitation()
    role1 = await f.create_role(project=invitation1.project)
    role2 = await f.create_role(project=invitation2.project)
    invitation1.role = role1
    invitation2.role = role2

    objs = [invitation1, invitation2]

    await repositories.update_invitations(objs=objs)

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
    await f.create_invitation(status=InvitationStatus.PENDING, project=project, user=user)

    assert await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_exists_for_email():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_invitation(status=InvitationStatus.PENDING, project=project, user=None, email=user.email)

    assert await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_does_not_exists_with_invilid_user():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_invitation(
        status=InvitationStatus.PENDING,
        project=project,
        user=await f.create_user(),
    )

    assert not await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_does_not_exists_with_invalid_email():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_invitation(status=InvitationStatus.PENDING, project=project, user=None, email="invalid@email.com")

    assert not await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_does_not_exists_with_invalid_project():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_invitation(
        status=InvitationStatus.PENDING,
        user=user,
    )

    assert not await repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def test_has_pending_project_invitation_for_user_does_not_exists_because_is_not_pending():
    user = await f.create_user()
    project = await f.create_project()
    await f.create_invitation(status=InvitationStatus.ACCEPTED, project=project, user=user)

    assert not await repositories.has_pending_project_invitation_for_user(user=user, project=project)
