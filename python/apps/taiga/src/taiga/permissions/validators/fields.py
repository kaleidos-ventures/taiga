# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Callable, Generator

from taiga.permissions import choices

CallableGenerator = Generator[Callable[..., Any], None, None]


class Permissions(list[str]):
    @classmethod
    def __modify_schema__(cls, field_schema: dict[str, Any]) -> None:
        field_schema["example"] = ["view_story"]
        field_schema["format"] = None

    @classmethod
    def __get_validators__(cls) -> CallableGenerator:
        yield cls.validate

    @classmethod
    def validate(cls, value: list[str]) -> list[str]:
        assert _permissions_are_valid(
            permissions=value
        ), "One or more permissions are not valid. Maybe, there is a typo."
        assert _permissions_are_compatible(permissions=value), "Given permissions are incompatible"
        return value


def _permissions_are_valid(permissions: list[str]) -> bool:
    return set.issubset(set(permissions), set(choices.ProjectPermissions))


def _permissions_are_compatible(permissions: list[str]) -> bool:
    # a user cannot see tasks if she has no access to stories
    if "view_story" not in permissions and set.intersection(set(permissions), set(["view_task"])):
        return False

    # a user cannot edit a story if she has no view permission
    if "view_story" not in permissions and set.intersection(set(permissions), choices.EditStoryPermissions):
        return False

    # a user cannot edit a task if she has no view permission
    if "view_task" not in permissions and set.intersection(set(permissions), choices.EditTaskPermissions):
        return False

    return True
