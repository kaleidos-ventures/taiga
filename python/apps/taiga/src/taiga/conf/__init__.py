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

from pydantic import AnyHttpUrl, BaseSettings, EmailStr
from taiga.conf.emails import EmailSettings
from taiga.conf.images import ImageSettings
from taiga.conf.logs import LOGGING_CONFIG
from taiga.conf.tokens import TokensSettings


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
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432

    # Pagination
    MAX_PAGE_SIZE: int = 100

    # Auth
    ACCESS_TOKEN_LIFETIME: int = 30  # 30 minutes
    REFRESH_TOKEN_LIFETIME: int = 8 * 24 * 60  # 8 * 24 * 60 minutes = 8 days
    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None

    # Users
    USER_EMAIL_ALLOWED_DOMAINS: list[str] = []
    VERIFY_USER_TOKEN_LIFETIME: int = 4 * 24 * 60  # 4 * 24 * 60 minutes = 4 days
    RESET_PASSWORD_TOKEN_LIFETIME: int = 2 * 60  # 2 * 60 minutes = 2 hours

    # Projects
    PROJECT_INVITATION_LIFETIME: int = 4 * 24 * 60  # 4 * 24 * 60 minutes = 4 days
    PROJECT_INVITATION_RESEND_LIMIT: int = 10
    DEFAULT_PROJECT_TEMPLATE: str = "kanban"

    # Tasks (linux crontab style)
    CLEAN_EXPIRED_TOKENS_CRON: str = "0 0 * * *"  # default: once a day
    CLEAN_EXPIRED_USERS_CRON: str = "0 0 * * *"  # default: once a day

    # Templates
    SUPPORT_EMAIL: EmailStr = EmailStr("support@example.com")

    # Sub settings modules
    TOKENS: TokensSettings = TokensSettings()
    IMAGES: ImageSettings = ImageSettings()
    EMAIL: EmailSettings = EmailSettings()

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
