# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import UploadFile
from pydantic import conint, constr, validator
from taiga.base.serializer import BaseModel
from taiga.base.utils.images import valid_content_type, valid_image_format
from taiga.base.validator import as_form


@as_form
class ProjectValidator(BaseModel):
    name: constr(strip_whitespace=True, max_length=80)  # type: ignore
    workspace_slug: str
    description: constr(max_length=200) | None = None  # type: ignore
    color: conint(gt=0, lt=9) | None = None  # type: ignore
    logo: UploadFile | None = None

    @validator("name")
    def check_name_not_empty(cls, v: str) -> str:
        assert v != "", "Empty name is not allowed"
        return v

    @validator("logo")
    def check_content_type(cls, v: UploadFile | None) -> UploadFile | None:
        if v:
            assert valid_content_type(v), "Invalid image format"
        return v

    @validator("logo")
    def check_image_format(cls, v: UploadFile | None) -> UploadFile | None:
        if v:
            assert valid_image_format(v), "Invalid image content"
        return v


class PermissionsValidator(BaseModel):
    permissions: list[str]
