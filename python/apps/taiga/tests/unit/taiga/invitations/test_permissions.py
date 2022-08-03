# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.invitations import permissions
from taiga.users.models import AnonymousUser
from tests.utils import factories as f

###########################################################################
# IsProjectInvitationRecipient
###########################################################################


@pytest.mark.parametrize(
    "invitation_email, user_email, user_is_active, expected",
    [
        # Allowed / True
        ("test@email.com", "test@email.com", True, True),
        # Not allowed / False
        ("test@email.com", "test@email.com", False, False),
        ("test1@email.com", "test@email.com", True, False),
    ],
)
async def test_is_project_invitation_recipient_permission_with_different_emails(
    invitation_email, user_email, user_is_active, expected
):
    perm = permissions.IsProjectInvitationRecipient()
    user = f.build_user(email=invitation_email, is_active=user_is_active)
    invitation = f.build_invitation(user=user, email=user_email)

    assert await perm.is_authorized(user, invitation) == expected


async def test_is_project_invitation_recipient_permission_with_anonymous_user():
    perm = permissions.IsProjectInvitationRecipient()
    user = AnonymousUser()
    invitation = f.build_invitation(email="some@email.com")

    assert not await perm.is_authorized(user, invitation)


###########################################################################
# HasPendingProjectInvitation
###########################################################################


@pytest.mark.parametrize(
    "project, user, has_pending_invitation, expected",
    [
        (None, f.build_user(is_active=True), None, False),
        (f.build_project(), AnonymousUser(), None, False),
        (f.build_project(), f.build_user(is_active=False), None, False),
        (f.build_project(), f.build_user(is_active=True), False, False),
        (f.build_project(), f.build_user(is_active=True), True, True),
    ],
)
async def test_has_pending_project_invitation_permission(project, user, has_pending_invitation, expected):
    perm = permissions.HasPendingProjectInvitation()

    with patch("taiga.invitations.permissions.invitations_services", autospec=True) as fake_invitations_serv:
        fake_invitations_serv.has_pending_project_invitation_for_user.return_value = has_pending_invitation is True

        assert await perm.is_authorized(user, project) == expected

        if has_pending_invitation is not None:
            fake_invitations_serv.has_pending_project_invitation_for_user.assert_awaited_once_with(
                project=project, user=user
            )
        else:
            fake_invitations_serv.has_pending_project_invitation_for_user.assert_not_awaited()
