# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging.config
import os
import secrets
from functools import lru_cache

from pydantic import AnyHttpUrl, BaseSettings
from taiga.conf.images import ImageSettings

from .logs import LOGGING_CONFIG
from .tokens import TokensSettings


class Settings(BaseSettings):
    # Commons
    SECRET_KEY: str = secrets.token_urlsafe(32)
    DEBUG: bool = False

    # Taiga URLS
    BACKEND_URL: AnyHttpUrl = AnyHttpUrl.build(scheme="http", host="localhost", port="8000")
    FRONTEND_URL: AnyHttpUrl = AnyHttpUrl.build(scheme="http", host="localhost", port="4200")

    # Database
    DB_NAME: str = "taiga"
    DB_USER: str = "taiga"
    DB_PASSWORD: str = "taiga"
    DB_HOST: str = ""
    DB_PORT: str = ""

    # Auth
    ACCESS_TOKEN_LIFETIME: int = 30  # 30 minutes
    REFRESH_TOKEN_LIFETIME: int = 8 * 24 * 60  # 8 * 24 * 60 minutes = 8 days

    # Sub settings modules
    TOKENS: TokensSettings = TokensSettings()
    IMAGES: ImageSettings = ImageSettings()

    DEFAULT_PROJECT_TEMPLATE: str = "kanban"

    class Config:
        env_prefix = "TAIGA_"
        case_sensitive = True
        env_file = os.getenv("TAIGA_ENV_FILE", ".env")
        env_file_encoding = os.getenv("TAIGA_ENV_FILE_ENCODING", "utf-8")


@lru_cache()
def get_settings() -> Settings:
    return Settings()


logging.config.dictConfig(LOGGING_CONFIG)
settings: Settings = get_settings()
