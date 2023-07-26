# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from typing import Any

from pydantic import BaseSettings


class ImageSettings(BaseSettings):
    THUMBNAIL_PROJECT_LOGO_SMALL: str = "32x32_crop"
    THUMBNAIL_PROJECT_LOGO_LARGE: str = "80x80_crop"
    THUMBNAIL_ALIASES: dict[str, Any] = {
        "32x32_crop": {"size": (32, 32), "crop": True},
        "80x80_crop": {"size": (80, 80), "crop": True},
    }
    VALID_CONTENT_TYPES: list[str] = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    ]

    class Config:
        case_sensitive = True
