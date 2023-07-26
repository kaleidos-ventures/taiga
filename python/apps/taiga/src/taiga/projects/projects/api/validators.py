# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from fastapi import UploadFile
from pydantic import conint, constr, validator
from taiga.base.utils.images import valid_content_type, valid_image_content
from taiga.base.validators import B64UUID, BaseModel, as_form
from taiga.permissions.validators import Permissions


@as_form
class ProjectValidator(BaseModel):
    name: constr(strip_whitespace=True, max_length=80)  # type: ignore
    workspace_id: B64UUID
    # description max_length validation to 220 characteres to resolve
    # this problem https://stackoverflow.com/a/69851342/2883148
    description: constr(max_length=220) | None = None  # type: ignore
    color: conint(gt=0, lt=9) | None = None  # type: ignore
    logo: UploadFile | None = None

    @validator("name")
    def check_name_not_empty(cls, v: str) -> str:
        assert v != "", "Empty name is not allowed"
        return v

    @validator("logo")
    def check_content_type(cls, v: UploadFile | None) -> UploadFile | None:
        if v:
            assert valid_content_type(v), "Invalid image content type"
        return v

    @validator("logo")
    def check_image_content(cls, v: UploadFile | None) -> UploadFile | None:
        if v:
            assert valid_image_content(v), "Invalid image content"
        return v


@as_form
class UpdateProjectValidator(BaseModel):
    name: constr(strip_whitespace=True, max_length=80) | None  # type: ignore
    description: constr(max_length=220) | None  # type: ignore
    logo: UploadFile | None

    @validator("logo")
    def check_content_type(cls, v: UploadFile | None) -> UploadFile | None:
        if v:
            assert valid_content_type(v), "Invalid image content type"
        return v

    @validator("logo")
    def check_image_content(cls, v: UploadFile | None) -> UploadFile | None:
        if v:
            assert valid_image_content(v), "Invalid image content"
        return v


class PermissionsValidator(BaseModel):
    permissions: Permissions
