# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging.config
import secrets
from functools import lru_cache

from pydantic import BaseSettings  # , AnyHttpUrl, EmailStr, HttpUrl, PostgresDsn, validator

from .logs import LOGGING_CONFIG
from .tokens import TokensSettings


class Settings(BaseSettings):
    SECRET_KEY: str = secrets.token_urlsafe(32)
    DEBUG: bool = True

    TOKENS: TokensSettings = TokensSettings()

    class Config:
        env_prefix = "TAIGA_"
        case_sensitive = True
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


logging.config.dictConfig(LOGGING_CONFIG)
settings: Settings = get_settings()
