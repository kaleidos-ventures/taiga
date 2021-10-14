# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, Optional, Union

from django.db.models.fields.files import FieldFile
from pydantic import AnyHttpUrl, BaseModel, validator
from taiga.projects.services import get_logo_large_thumbnail_url, get_logo_small_thumbnail_url


class ProjectLogoMixin(BaseModel):
    logo: Optional[Any] = None
    logo_small: Optional[AnyHttpUrl] = None
    logo_big: Optional[AnyHttpUrl] = None

    @validator("logo")
    def logo_serializer(cls, v: Any) -> Optional[str]:
        if v and type(v) == FieldFile:
            # Serializing from creation (thumbnails have to be created)
            return v.name
        if v and type(v) == str:
            # Thumbnails already available
            return v
        return None

    @validator("logo_small", always=True)
    def get_logo_small(cls, value: Any, values: Any) -> Union[str, None]:
        if values["logo"]:
            return get_logo_small_thumbnail_url(values["logo"])
        return None

    @validator("logo_big", always=True)
    def get_logo_big(cls, value: Any, values: Any) -> Union[str, None]:
        if values["logo"]:
            return get_logo_large_thumbnail_url(values["logo"])
        return None
