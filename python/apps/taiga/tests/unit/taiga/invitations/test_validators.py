# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from pydantic import ValidationError
from taiga.invitations.validators import InvitationsValidator, InvitationValidator


def test_validate_invitation_with_empty_role_slug(client):
    email = "test@email.com"
    role_slug = ""

    with pytest.raises(ValidationError, match=r"Empty field is not allowed"):
        InvitationValidator(email=email, role_slug=role_slug)


def test_validate_invitations_with_duplicated_items(client):
    invitations = [
        {"email": "test@email.com", "role_slug": "general"},
        {"email": "test@email.com", "role_slug": "general"},
    ]

    with pytest.raises(ValidationError, match=r"value_error.list.unique_items"):
        InvitationsValidator(invitations=invitations)


def test_validate_invitations_more_than_50(client):
    invitations = []
    for i in range(55):
        invitations.append({"email": f"test{i}@email.com", "role_slug": "general"})

    with pytest.raises(ValidationError, match=r"value_error.list.max_items"):
        InvitationsValidator(invitations=invitations)
