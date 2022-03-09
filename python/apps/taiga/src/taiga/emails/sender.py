# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
import logging

from aiosmtplib import SMTPConnectError
from fastapi_mailman import EmailMultiAlternatives, Mail  # type: ignore
from fastapi_mailman.config import ConnectionConfig  # type: ignore
from taiga.conf import settings

logger = logging.getLogger(__name__)


async def send_email(
    subject: str | None = None,
    to_emails: list[str] = [],
    from_email: str | None = None,
    text_content: str | None = None,
    html_content: str | None = None,
    attachment_paths: list[str] = [],
) -> None:
    """
    Send multipart (attachments) / alternative (text and HTML version) messages
    to multiple recipients using the configured backend"""

    message = EmailMultiAlternatives(
        connection=_get_mail_connection(),
        subject=subject,
        body=text_content,
        to=to_emails,
        from_email=from_email,
    )

    if html_content:
        message.attach_alternative(html_content, "text/html")

    for attachment_path in attachment_paths:
        try:
            message.attach_file(path=attachment_path)
        except FileNotFoundError as exception:
            logging.error(f"Email attachment error. {exception}")

    try:
        await message.send()
    except SMTPConnectError as exception:
        logger.error(f"SMTP connection error. {exception}")
    except Exception as exception:
        logger.error(f"Unknown email error. {exception}")


def _get_mail_connection() -> Mail:
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

    return Mail(connection_config).get_connection()
