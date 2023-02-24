# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from fastapi_mailman import EmailMultiAlternatives, Mail  # type: ignore
from fastapi_mailman.config import ConnectionConfig  # type: ignore
from taiga.conf import settings
from taiga.conf.emails import EmailBackends


async def send_email_message(
    subject: str | None = None,
    to_emails: list[str] = [],
    from_email: str | None = None,
    body_txt: str | None = None,
    body_html: str | None = None,
    attachment_paths: list[str] = [],
) -> None:
    """
    NOTE: DO NOT USE THIS SERVICE DIRECTLY, USE THE TASK INSTEAD

    Send multipart (attachments) / alternative (text and HTML version) messages
    to multiple recipients using the configured backend
    """

    message = EmailMultiAlternatives(
        connection=_get_mail_connection(),
        subject=subject,
        body=body_txt,
        to=to_emails,
        from_email=from_email,
    )

    if body_html:
        message.attach_alternative(body_html, "text/html")

    for attachment_path in attachment_paths:
        message.attach_file(path=attachment_path)

    await message.send()


def _get_email_backend() -> str:
    if settings.EMAIL.BACKEND == EmailBackends.CONSOLE_TEXT:
        return "taiga.emails.backends.console_text"
    return settings.EMAIL.BACKEND.value


def _get_mail_connection() -> Mail:
    connection_config = ConnectionConfig(
        # common email settings
        MAIL_BACKEND=_get_email_backend(),
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
