# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from enum import Enum

from pydantic import BaseSettings, EmailStr


class EmailBackends(Enum):
    SMTP = "smtp"
    CONSOLE = "console"
    FILE = "file"
    LOC_MEM = "locmem"
    DUMMY = "dummy"
    CONSOLE_TEXT = "console_text"


class EmailSettings(BaseSettings):
    # common email settings
    BACKEND: EmailBackends = EmailBackends.CONSOLE
    DEFAULT_SENDER: EmailStr = EmailStr("username@domain.name")

    # smtp backend settings
    SERVER: str = "smtp.domain.name"
    USERNAME: str = "smtp.username"
    PASSWORD: str = "smtp.password"
    PORT: int = 25
    TIMEOUT: int | None = None
    USE_TLS: bool = True
    USE_SSL: bool = False
    # path to a PEM-formatted certificate chain file to use for the SSL connection
    SSL_CERTFILE: str | None = None
    # path to a PEM-formatted private key file to use for the SSL connection
    SSL_KEYFILE: str | None = None
    # send the SMTP Date header of email messages in the local time zone or in UTC
    USE_LOCALTIME: bool = False

    # file backend settings
    FILE_PATH: str = "./"

    class Config:
        case_sensitive = True
