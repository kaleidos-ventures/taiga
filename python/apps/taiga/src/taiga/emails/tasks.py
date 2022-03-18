# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import logging
from typing import Any

from aiosmtplib import SMTPConnectError
from jinja2 import TemplateNotFound
from taiga.emails.emails import Emails
from taiga.emails.exceptions import EmailAttachmentError, EmailDeliveryError, EmailSMTPError, EmailTemplateError
from taiga.emails.render import render_email_html, render_email_txt, render_subject
from taiga.emails.sender import send_email_message
from taiga.tasksqueue.manager import manager as tqmanager

logger = logging.getLogger(__name__)


@tqmanager.task
async def send_email(
    email_name: str,
    to: str | list[str],
    context: dict[str, Any] = {},
    attachment_paths: list[str] = [],
) -> None:

    # validate the email template
    try:
        Emails(email_name)
    except ValueError:
        raise EmailTemplateError(f"The email `{email_name}` it's not an allowed `Emails` instance")

    # prepare the email recipients
    to_emails = to
    if isinstance(to_emails, str):
        to_emails = [to_emails]
    if not to_emails:
        logger.error("Requested to send an email with no recipients. Aborting.")
        return

    # render the email contents using both the email template and variables dictionary
    try:
        body_txt = render_email_txt(email_name, context)
        subject = render_subject(email_name, context)
        body_html = render_email_html(email_name, context)
    except TemplateNotFound as template_exception:
        raise EmailTemplateError(f"Missing or invalid email template. {template_exception}")

    # send the email message using the configured backend
    try:
        await send_email_message(
            subject=subject,
            to_emails=to_emails,
            body_txt=body_txt,
            body_html=body_html,
            attachment_paths=attachment_paths,
        )
    except SMTPConnectError as smtp_exception:
        raise EmailSMTPError(f"SMTP connection could not be established. {smtp_exception}")
    except FileNotFoundError as file_attachments_exception:
        raise EmailAttachmentError(f"Email attachment error. {file_attachments_exception}")
    except Exception as delivery_exception:
        raise EmailDeliveryError(f"Unknown error while delivering an email. {delivery_exception}")
