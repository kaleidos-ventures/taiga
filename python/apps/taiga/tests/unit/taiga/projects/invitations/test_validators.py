# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from pydantic import ValidationError
from taiga.projects.invitations.validators import ProjectInvitationsValidator, ProjectInvitationValidator
from tests.unit.utils import check_validation_errors


@pytest.mark.parametrize(
    "email, username, role_slug, error_fields, expected_errors",
    [
        ("email@test.com", "username", "", ["roleSlug"], "Empty field is not allowed"),
        ("email@test.com", "username", None, ["roleSlug"], "none is not an allowed value"),
        ("not an email", "username", "role", ["email"], "value is not a valid email address"),
    ],
)
def test_email_role_slug(email, username, role_slug, error_fields, expected_errors):
    with pytest.raises(ValidationError) as validation_errors:
        ProjectInvitationValidator(email=email, username=username, role_slug=role_slug)

    expected_error_fields = error_fields
    expected_error_messages = expected_errors
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)


def test_validate_invitations_more_than_50():
    invitations = []
    for i in range(55):
        invitations.append({"email": f"test{i}@email.com", "role_slug": "general"})

    with pytest.raises(ValidationError, match=r"value_error.list.max_items") as validation_errors:
        ProjectInvitationsValidator(invitations=invitations)

    expected_error_fields = ["invitations"]
    expected_error_messages = ["ensure this value has at most 50 items"]
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)
