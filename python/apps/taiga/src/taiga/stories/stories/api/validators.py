# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from pydantic import ConstrainedStr, conlist, validator
from pydantic.class_validators import root_validator
from pydantic.types import PositiveInt
from taiga.base.validators import B64UUID, BaseModel


class Title(ConstrainedStr):
    strip_whitespace = True
    min_length = 1
    max_length = 500


class StoryValidator(BaseModel):
    title: Title
    description: str | None = None
    status: B64UUID


class UpdateStoryValidator(BaseModel):
    version: PositiveInt
    title: Title | None
    description: str | None
    status: B64UUID | None
    workflow: str | None

    @root_validator
    def status_or_workflow(cls, values: dict[Any, Any]) -> dict[Any, Any]:
        status = values.get("status")
        workflow = values.get("workflow")
        assert not (status and workflow), "It's not allowed to update both the status and workspace"
        return values


class ReorderValidator(BaseModel):
    place: str
    ref: int

    @validator("place")
    def check_valid_place(cls, v: str) -> str:
        assert v in ["before", "after"], "Place should be 'after' or 'before'"
        return v


class ReorderStoriesValidator(BaseModel):
    status: B64UUID
    stories: conlist(int, min_items=1)  # type: ignore[valid-type]
    reorder: ReorderValidator | None

    @validator("stories")
    def return_unique_stories(cls, v: list[int]) -> list[int]:
        """
        If there are some stories references repeated, ignore them,
        but keep the original order. Example:
        v = [1, 1, 9, 1, 9, 6, 9, 7]
        return [1, 9, 6, 7]
        """
        return sorted(set(v), key=v.index)

    def get_reorder_dict(self) -> dict[str, Any]:
        return self.dict()["reorder"]
