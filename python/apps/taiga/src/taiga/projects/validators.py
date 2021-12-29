# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import List, Optional

from fastapi import UploadFile
from pydantic import validator
from taiga.base.serializer import BaseModel
from taiga.base.utils.images import valid_content_type, valid_image_format
from taiga.base.validator import as_form
from taiga.workspaces import services as workspaces_services


@as_form
class ProjectValidator(BaseModel):
    name: str
    workspace_slug: str
    description: Optional[str]
    color: Optional[int]
    logo: Optional[UploadFile]

    @validator("name")
    def check_name_not_empty(cls, v: str) -> str:
        assert v != "", "Empty name is not allowed"
        return v

    @validator("name")
    def check_name_length(cls, v: str) -> str:
        assert len(v) <= 80, "Name too long"
        return v

    @validator("description")
    def check_description_length(cls, v: str) -> str:
        if v:
            assert len(v) <= 200, "Description too long"
        return v

    @validator("workspace_slug")
    def check_workspace_exist(cls, v: str) -> str:
        assert workspaces_services.get_workspace(v) is not None, "Workspace slug is not valid"
        return v

    @validator("color")
    def check_allowed_color(cls, v: int) -> int:
        assert v >= 1 and v <= 8, "Color not allowed"
        return v

    @validator("logo")
    def check_content_type(cls, v: UploadFile) -> UploadFile:
        if v:
            assert valid_content_type(v), "Invalid image format"
        return v

    @validator("logo")
    def check_image_format(cls, v: UploadFile) -> UploadFile:
        if v:
            assert valid_image_format(v), "Invalid image content"
        return v

    # Sanitizers

    @validator("name")
    def strip_name(cls, v: str) -> str:
        return v.strip()


class PermissionsValidator(BaseModel):
    permissions: List[str]
