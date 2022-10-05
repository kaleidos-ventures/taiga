# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from pydantic import conlist, constr, validator
from taiga.base.serializers import BaseModel


class StoryValidator(BaseModel):
    title: constr(strip_whitespace=True, max_length=500)  # type: ignore
    status: str

    @validator("status")
    def check_not_empty(cls, v: str) -> str:
        assert v != "", "Empty field is not allowed"
        return v


class ReorderValidator(BaseModel):
    place: str
    ref: int

    @validator("place")
    def check_valid_place(cls, v: str) -> str:
        assert v in ["before", "after"], "Place should be 'after' or 'before'"
        return v


class ReorderStoriesValidator(BaseModel):
    status: str
    stories: conlist(int, min_items=1)  # type: ignore[valid-type]
    reorder: ReorderValidator | None

    @validator("status")
    def check_not_empty(cls, v: str) -> str:
        assert v != "", "Empty field is not allowed"
        return v

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
