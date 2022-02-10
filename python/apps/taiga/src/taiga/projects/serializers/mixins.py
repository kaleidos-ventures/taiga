# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from django.db.models.fields.files import FieldFile
from pydantic import AnyHttpUrl, BaseModel, validator
from taiga.base.utils.asyncio import run_async_as_sync
from taiga.projects.services import get_logo_large_thumbnail_url, get_logo_small_thumbnail_url


class ProjectLogoMixin(BaseModel):
    logo: Any = None
    logo_small: AnyHttpUrl | None = None
    logo_big: AnyHttpUrl | None = None

    @validator("logo", always=True)
    def logo_serializer(cls, v: FieldFile | str | None) -> str | None:
        if v and isinstance(v, FieldFile):
            # Serializing from creation (thumbnails have to be created)
            return v.name
        if v and isinstance(v, str):
            # Thumbnails already available
            return v
        return None

    @validator("logo_small", always=True)
    def get_logo_small(cls, value: str | None) -> str | None:
        if value:
            return run_async_as_sync(get_logo_small_thumbnail_url(value))
        return None

    @validator("logo_big", always=True)
    def get_logo_big(cls, value: str | None) -> str | None:
        if value:
            return run_async_as_sync(get_logo_large_thumbnail_url(value))
        return None
