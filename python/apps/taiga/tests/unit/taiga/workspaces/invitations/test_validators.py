# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from pydantic import ValidationError
from taiga.workspaces.invitations.api.validators import WorkspaceInvitationsValidator, WorkspaceInvitationValidator
from tests.unit.utils import check_validation_errors


@pytest.mark.parametrize(
    "username_or_email, error_fields, expected_errors",
    [
        ("", ["email"], "Empty field is not allowed"),
        (None, ["email"], "none is not an allowed value"),
    ],
)
def test_email(username_or_email, error_fields, expected_errors):
    with pytest.raises(ValidationError) as validation_errors:
        WorkspaceInvitationValidator(username_or_email=username_or_email)

    expected_error_fields = error_fields
    expected_error_messages = expected_errors
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)


def test_validate_invitations_more_than_50():
    invitations = []
    for i in range(55):
        invitations.append({"username_or_email": f"test{i}@email.com"})

    with pytest.raises(ValidationError, match=r"value_error.list.max_items") as validation_errors:
        WorkspaceInvitationsValidator(invitations=invitations)

    expected_error_fields = ["invitations"]
    expected_error_messages = ["ensure this value has at most 50 items"]
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)
