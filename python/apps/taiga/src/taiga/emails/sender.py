# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
import logging

from aiosmtplib import SMTPConnectError
from fastapi_mailman import EmailMultiAlternatives  # type: ignore
from taiga.emails import mail_connection

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
        connection=mail_connection,
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
