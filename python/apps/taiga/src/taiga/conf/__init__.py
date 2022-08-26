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
from pathlib import Path
from urllib.parse import urljoin

from pydantic import AnyHttpUrl, BaseSettings, EmailStr, validator
from taiga.conf.emails import EmailSettings
from taiga.conf.events import EventsSettings
from taiga.conf.images import ImageSettings
from taiga.conf.logs import LOGGING_CONFIG
from taiga.conf.tokens import TokensSettings

_BASE_DIR = Path(__file__).resolve().parent.parent.parent  # is 'src'
_DEFAULT_BACKEND_URL = AnyHttpUrl.build(scheme="http", host="localhost", port="8000")
_DEFAULT_FRONTEND_URL = AnyHttpUrl.build(scheme="http", host="localhost", port="4200")
_DEFAULT_STATIC_URL = AnyHttpUrl.build(scheme="http", host="localhost", port="8000", path="/static/")
_DEFAULT_MEDIA_URL = AnyHttpUrl.build(scheme="http", host="localhost", port="8000", path="/media/")


class Settings(BaseSettings):
    # Commons
    SECRET_KEY: str = secrets.token_urlsafe(32)
    UUID_NODE: int | None = None
    DEBUG: bool = False

    # Taiga URLS
    BACKEND_URL: AnyHttpUrl = _DEFAULT_BACKEND_URL
    FRONTEND_URL: AnyHttpUrl = _DEFAULT_FRONTEND_URL

    # Database
    DB_NAME: str = "taiga"
    DB_USER: str = "taiga"
    DB_PASSWORD: str = "taiga"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432

    # Media and Static files
    STATIC_URL: AnyHttpUrl = _DEFAULT_STATIC_URL
    STATIC_ROOT: Path = _BASE_DIR.parent.joinpath("static/")
    MEDIA_URL: AnyHttpUrl = _DEFAULT_MEDIA_URL
    MEDIA_ROOT: Path = _BASE_DIR.parent.joinpath("media/")

    # I18N
    LANG: str = "en_US"

    # Pagination
    DEFAULT_PAGE_SIZE: int = 10
    MAX_PAGE_SIZE: int = 100

    # Auth
    ACCESS_TOKEN_LIFETIME: int = 30  # 30 minutes
    REFRESH_TOKEN_LIFETIME: int = 8 * 24 * 60  # 8 * 24 * 60 minutes = 8 days
    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None
    GITLAB_URL: str | None = None
    GITLAB_CLIENT_ID: str | None = None
    GITLAB_CLIENT_SECRET: str | None = None
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None

    # Users
    USER_EMAIL_ALLOWED_DOMAINS: list[str] = []
    VERIFY_USER_TOKEN_LIFETIME: int = 4 * 24 * 60  # 4 * 24 * 60 minutes = 4 days
    RESET_PASSWORD_TOKEN_LIFETIME: int = 2 * 60  # 2 * 60 minutes = 2 hours

    # Projects
    PROJECT_INVITATION_LIFETIME: int = 4 * 24 * 60  # 4 * 24 * 60 minutes = 4 days
    PROJECT_INVITATION_RESEND_LIMIT: int = 10
    PROJECT_INVITATION_RESEND_TIME: int = 10  # 10 minutes
    DEFAULT_PROJECT_TEMPLATE: str = "kanban"

    # Tasks (linux crontab style)
    CLEAN_EXPIRED_TOKENS_CRON: str = "0 0 * * *"  # default: once a day
    CLEAN_EXPIRED_USERS_CRON: str = "0 0 * * *"  # default: once a day

    # Templates
    SUPPORT_EMAIL: EmailStr = EmailStr("support@example.com")

    # Sub settings modules
    EMAIL: EmailSettings = EmailSettings()
    EVENTS: EventsSettings = EventsSettings()
    IMAGES: ImageSettings = ImageSettings()
    TOKENS: TokensSettings = TokensSettings()

    @validator("UUID_NODE", pre=False)
    def validate_uuid_node(cls, v: int | None) -> int | None:
        if v is not None and not 0 <= v < 1 << 48:
            raise ValueError("out of range (need a 48-bit value)")
        return v

    @validator("STATIC_URL", always=True)
    def set_static_url(cls, v: AnyHttpUrl, values: dict[str, AnyHttpUrl]) -> str:
        return v if v != _DEFAULT_STATIC_URL else urljoin(values["BACKEND_URL"], "/static/")

    @validator("MEDIA_URL", always=True)
    def set_media_url(cls, v: AnyHttpUrl, values: dict[str, AnyHttpUrl]) -> str:
        return v if v != _DEFAULT_MEDIA_URL else urljoin(values["BACKEND_URL"], "/media/")

    @validator("LANG", always=True)
    def validate_lang(cls, v: str) -> str:
        from taiga.base.i18n import i18n

        if not i18n.is_language_available(v):
            available_languages_for_display = "\n".join(i18n.available_languages)
            raise ValueError(f"LANG should be one of \n{ available_languages_for_display }\n")
        return v

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
