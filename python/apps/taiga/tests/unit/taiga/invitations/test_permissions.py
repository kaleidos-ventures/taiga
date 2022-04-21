# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.invitations import permissions
from taiga.users.models import AnonymousUser
from tests.utils import factories as f


@pytest.mark.parametrize(
    "invitation_email, user_email, expected",
    [
        # Allowed / True
        ("test@email.com", "test@email.com", True),
        # Not allowed / False
        ("test1@email.com", "test@email.com", False),
    ],
)
async def test_is_an_invitation_for_me_permission_with_different_emails(invitation_email, user_email, expected):
    perm = permissions.IsAnInvitationForMe()
    user = f.build_user(email=invitation_email)
    invitation = f.build_invitation(email=user_email)

    assert await perm.is_authorized(user, invitation) == expected


async def test_is_an_invitation_for_me_permission_with_anonymous_user():
    perm = permissions.IsAnInvitationForMe()
    user = AnonymousUser()
    invitation = f.build_invitation(email="some@email.com")

    assert not await perm.is_authorized(user, invitation)
