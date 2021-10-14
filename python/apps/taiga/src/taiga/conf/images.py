# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from typing import Any, Dict, List

from pydantic import BaseSettings


class ImageSettings(BaseSettings):
    THUMBNAIL_PROJECT_LOGO_SMALL: str = "32x32_crop"
    THUMBNAIL_PROJECT_LOGO_LARGE: str = "80x80_crop"
    THUMBNAIL_ALIASES: Dict[str, Any] = {
        "32x32_crop": {"size": (32, 32), "crop": True},
        "80x80_crop": {"size": (80, 80), "crop": True},
    }
    VALID_IMAGE_FORMATS: List[str] = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
    ]

    class Config:
        case_sensitive = True
