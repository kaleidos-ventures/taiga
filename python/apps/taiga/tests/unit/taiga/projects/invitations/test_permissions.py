# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.projects.invitations import permissions
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
    invitation = f.build_project_invitation(user=user, email=user_email)

    assert await perm.is_authorized(user, invitation) == expected


async def test_is_project_invitation_recipient_permission_with_anonymous_user():
    perm = permissions.IsProjectInvitationRecipient()
    user = AnonymousUser()
    invitation = f.build_project_invitation(user=None, email="some@email.com")

    assert not await perm.is_authorized(user, invitation)
