# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from typing import Any
from uuid import UUID

from pydantic import ConstrainedStr, conint, conlist, validator
from taiga.base.utils.uuid import decode_b64str_to_uuid
from taiga.base.validators import B64UUID, BaseModel
from taiga.exceptions import api as ex


class WorkflowStatusName(ConstrainedStr):
    strip_whitespace = True
    min_length = 1
    max_length = 30


class WorkflowName(ConstrainedStr):
    strip_whitespace = True
    min_length = 1
    max_length = 40


class CreateWorkflowValidator(BaseModel):
    name: WorkflowName


class CreateWorkflowStatusValidator(BaseModel):
    name: WorkflowStatusName
    color: conint(gt=0, lt=9)  # type: ignore


class UpdateWorkflowStatusValidator(BaseModel):
    name: WorkflowStatusName | None


class ReorderValidator(BaseModel):
    place: str
    status: B64UUID

    @validator("place")
    def check_valid_place(cls, v: str) -> str:
        assert v in ["before", "after"], "Place should be 'after' or 'before'"
        return v


class ReorderWorkflowStatusesValidator(BaseModel):
    statuses: conlist(B64UUID, min_items=1)  # type: ignore[valid-type]
    reorder: ReorderValidator

    @validator("statuses")
    def return_unique_statuses(cls, v: list[str]) -> list[str]:
        """
        If there are some statuses ids repeated, ignore them,
        but keep the original order. Example:
        v = ["1", "1", "2", "1", "2"]
        return ["1", "2"]
        """
        return sorted(set(v), key=v.index)

    def get_reorder_dict(self) -> dict[str, Any]:
        return self.dict()["reorder"]


class DeleteWorkflowStatusQuery(BaseModel):
    # TODO: fix to avoid double validation errors when using the B64UUID type (instead of str)
    move_to: str | None

    @validator("move_to")
    def check_b64uuid_from_str(cls, v: str | None) -> UUID | None:
        if v is None:
            return None

        try:
            return decode_b64str_to_uuid(v)
        except ValueError:
            raise ex.ValidationError("Invalid 'moveTo' workflow status")
