# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from pydantic import AnyHttpUrl, BaseModel, validator
from taiga.base.utils.asyncio import run_async_as_sync
from taiga.projects.projects.services import get_logo_large_thumbnail_url, get_logo_small_thumbnail_url


class ProjectLogoMixin(BaseModel):
    logo: Any = None
    logo_small: AnyHttpUrl | None = None
    logo_large: AnyHttpUrl | None = None

    @validator("logo", always=True)
    def logo_serializer(cls, v: Any | str | None) -> str | None:
        if not v:
            return None

        return str(v)

    @validator("logo_small", always=True)
    def get_logo_small(cls, v: str | None, values: dict[str, str | None]) -> str | None:
        logo = v or values.get("logo", None)

        if not logo:
            return None
        return run_async_as_sync(get_logo_small_thumbnail_url(logo))

    @validator("logo_large", always=True)
    def get_logo_large(cls, v: str | None, values: dict[str, str | None]) -> str | None:
        logo = v or values.get("logo", None)

        if not logo:
            return None
        return run_async_as_sync(get_logo_large_thumbnail_url(logo))
