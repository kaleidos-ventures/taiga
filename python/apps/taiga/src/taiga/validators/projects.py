# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Optional

from pydantic import validator
from taiga.base.serializer import BaseModel
from taiga.services import workspaces as workspaces_services


class ProjectValidator(BaseModel):
    name: str
    description: Optional[str]
    workspace_slug: str
    color: Optional[int]

    @validator("name")
    def check_name_not_empty(cls, v: str) -> str:
        assert v != "", "Empty name is not allowed."
        return v

    @validator("name")
    def check_name_length(cls, v: str) -> str:
        assert len(v) <= 80, "Name too long"
        return v

    @validator("description")
    def check_description_length(cls, v: str) -> str:
        assert len(v) <= 200, "Description too long"
        return v

    @validator("workspace_slug")
    def check_workspace_exist(cls, v: str) -> str:
        assert workspaces_services.get_workspace(v) is not None, "Workspace slug is not valid"
        return v

    @validator("color")
    def check_allowed_color(cls, v: int) -> int:
        assert v >= 1 and v <= 8, "Color not allowed."
        return v

    # Sanitizers

    @validator("name")
    def strip_name(cls, v: str) -> str:
        return v.strip()
