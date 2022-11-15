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
# get_project_invitation
##########################################################


async def test_get_project_invitation_ok() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation(filters={"id": invitation.id})

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_not_found() -> None:
    new_invitation = await repositories.get_project_invitation(filters={"id": 1001})

    assert new_invitation is None


async def test_get_project_invitation_by_user_username() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation(
        filters={
            "project_slug": invitation.project.slug,
            "username_or_email": invitation.user.username,
            "statuses": [ProjectInvitationStatus.PENDING],
        }
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_by_user_email() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation(
        filters={
            "project_slug": invitation.project.slug,
            "username_or_email": invitation.user.email,
            "statuses": [ProjectInvitationStatus.PENDING],
        }
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_by_email() -> None:
    invitation = await f.create_project_invitation(user=None)

    new_invitation = await repositories.get_project_invitation(
        filters={
            "project_slug": invitation.project.slug,
            "username_or_email": invitation.email,
            "statuses": [ProjectInvitationStatus.PENDING],
        }
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_by_email_no_status() -> None:
    invitation = await f.create_project_invitation(user=None)

    new_invitation = await repositories.get_project_invitation(
        filters={"project_slug": invitation.project.slug, "username_or_email": invitation.email}
    )

    assert new_invitation is not None
    assert new_invitation == invitation


async def test_get_project_invitation_by_id() -> None:
    invitation = await f.create_project_invitation()

    new_invitation = await repositories.get_project_invitation(filters={"id": invitation.id})

    assert new_invitation is not None
    assert new_invitation == invitation


async def get_project_invitation_by_id_not_found() -> None:
    new_invitation = await repositories.get_project_invitation(filters={"id": uuid.uuid1()})

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
        filters={"project_slug": project.slug, "status": ProjectInvitationStatus.PENDING}, offset=0, limit=100
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
        filters={"project_slug": project.slug, "user": user1, "status": ProjectInvitationStatus.PENDING},
        offset=0,
        limit=100,
    )
    assert len(response) == 1
    assert response[0].email == user1.email


async def test_get_project_invitations_single_pending_non_existing_user():
    project = await f.create_project()
    general_role = await sync_to_async(project.roles.get)(slug="general")

    non_existing_email = "non-existing@email.com"
    await f.create_project_invitation(
        email=non_existing_email, user=None, project=project, role=general_role, status=ProjectInvitationStatus.PENDING
    )

    invitations = await repositories.get_project_invitations(
        filters={"project_slug": project.slug, "email": non_existing_email, "status": ProjectInvitationStatus.PENDING},
        offset=0,
        limit=100,
    )
    assert len(invitations) == 1
    assert invitations[0].email == non_existing_email


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
        filters={"project_slug": project.slug, "status": ProjectInvitationStatus.ACCEPTED}, offset=0, limit=100
    )
    assert len(response) == 2
    assert response[0].email == user1.email
    assert response[1].email == user2.email


##########################################################
# update_project_invitation
##########################################################


async def test_update_project_invitation():
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    old_role = await f.create_project_role(project=project)
    invitation = await f.create_project_invitation(
        user=user, email=user.email, project=project, status=ProjectInvitationStatus.PENDING, role=old_role
    )
    assert invitation.role == old_role

    new_role = await f.create_project_role(project=project)
    invitation.role = new_role
    updated_invitation = await repositories.update_project_invitation(invitation=invitation)
    assert updated_invitation.role == new_role


async def test_bulk_update_project_invitations():
    project = await f.create_project()
    role1 = await f.create_project_role(project=project)
    invitation1 = await f.create_project_invitation(role=role1)
    invitation2 = await f.create_project_invitation(role=role1)

    assert invitation1.role == role1

    role2 = await f.create_project_role(project=invitation2.project)
    invitation1.role = role2
    invitation2.role = role2
    objs = [invitation1, invitation2]
    fields_to_update = ["role"]

    await repositories.bulk_update_project_invitations(objs_to_update=objs, fields_to_update=fields_to_update)
    updated_invitation1 = await repositories.get_project_invitation(filters={"id": invitation1.id})
    assert updated_invitation1.role == role2

    updated_invitation2 = await repositories.get_project_invitation(filters={"id": invitation2.id})
    assert updated_invitation2.role == role2


##########################################################
# misc - get_total_project_invitations
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
        filters={"project_slug": project.slug, "status": ProjectInvitationStatus.PENDING}
    )
    assert response == 3
