# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi_mailman import Mail  # type: ignore
from fastapi_mailman.config import ConnectionConfig  # type: ignore
from taiga.conf import settings

connection_config = ConnectionConfig(
    # common email settings
    MAIL_BACKEND=settings.EMAIL.BACKEND.value,
    MAIL_DEFAULT_SENDER=settings.EMAIL.DEFAULT_SENDER,
    # smtp backend settings
    MAIL_SERVER=settings.EMAIL.SERVER,
    MAIL_USERNAME=settings.EMAIL.USERNAME,
    MAIL_PASSWORD=settings.EMAIL.PASSWORD,
    MAIL_PORT=settings.EMAIL.PORT,
    MAIL_TIMEOUT=settings.EMAIL.TIMEOUT,
    MAIL_USE_TLS=settings.EMAIL.USE_TLS,
    MAIL_USE_SSL=settings.EMAIL.USE_SSL,
    MAIL_SSL_CERTFILE=settings.EMAIL.SSL_CERTFILE,
    MAIL_SSL_KEYFILE=settings.EMAIL.SSL_KEYFILE,
    MAIL_USE_LOCALTIME=settings.EMAIL.USE_LOCALTIME,
    # file backend settings
    MAIL_FILE_PATH=settings.EMAIL.FILE_PATH,
)

mail_connection = Mail(connection_config).get_connection()
