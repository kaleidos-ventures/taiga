# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from typing import Any

from pydantic import ConstrainedStr, conint, conlist, validator
from taiga.base.validators import BaseModel, StrNotEmpty


class Name(ConstrainedStr):
    strip_whitespace = True
    min_length = 1
    max_length = 30


class WorkflowStatusValidator(BaseModel):
    name: Name
    color: conint(gt=0, lt=9)  # type: ignore


class UpdateWorkflowStatusValidator(BaseModel):
    name: Name | None


class ReorderValidator(BaseModel):
    place: str
    status: StrNotEmpty

    @validator("place")
    def check_valid_place(cls, v: str) -> str:
        assert v in ["before", "after"], "Place should be 'after' or 'before'"
        return v


class ReorderWorkflowStatusesValidator(BaseModel):
    statuses: conlist(str, min_items=1)  # type: ignore[valid-type]
    reorder: ReorderValidator

    @validator("statuses")
    def return_unique_statuses(cls, v: list[str]) -> list[str]:
        """
        If there are some statuses slug repeated, ignore them,
        but keep the original order. Example:
        v = ["new", "new", "in-progress", "new", "in-progress"]
        return ["new", "in-progress"]
        """
        return sorted(set(v), key=v.index)

    def get_reorder_dict(self) -> dict[str, Any]:
        return self.dict()["reorder"]


class DeleteWorkflowStatusQuery(BaseModel):
    move_to: str | None
