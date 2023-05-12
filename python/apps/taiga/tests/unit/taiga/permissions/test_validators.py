# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from pydantic import ValidationError
from taiga.base.serializers import BaseModel
from taiga.permissions.validators import Permissions

#####################################################################
# Permissions
#####################################################################


class PermissionsValidator(BaseModel):
    permissions: Permissions


@pytest.mark.parametrize(
    "permissions, result",
    [
        ([], []),
        (["comment_story", "view_story"], ["comment_story", "view_story"]),
        (["view_story", "modify_story"], ["view_story", "modify_story"]),
    ],
)
def test_permissions_are_valid_and_compatible(permissions: list[str], result: list[str]):
    validator = PermissionsValidator(permissions=permissions)
    assert validator.permissions == result


@pytest.mark.parametrize(
    "permissions",
    [
        None,
        [None],
        [""],
        ["comment_story", "not_valid"],
        ["non_existent"],
        ["view_story", "foo"],
        ["add_story", "modify_story", "comment_story"],
    ],
)
def test_permissions_are_invalid_or_not_compatible(permissions: list[str] | None) -> None:
    with pytest.raises(ValidationError):
        PermissionsValidator(permissions=permissions)
