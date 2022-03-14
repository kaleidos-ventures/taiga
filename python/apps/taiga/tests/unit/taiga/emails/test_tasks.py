# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import tempfile
from unittest.mock import patch

import pytest
from aiosmtplib import SMTPConnectError
from fastapi_mailman import Mail
from fastapi_mailman.config import ConnectionConfig
from taiga.conf.emails import EmailBackends
from taiga.emails.exceptions import EmailAttachmentError, EmailDeliveryError, EmailSMTPError, EmailTemplateError
from taiga.emails.tasks import send_email

SUBJECT = "Email sent from FastPI-Mailman"
TO_EMAILS = ["username1@domain.name", "username2@domain.name"]
TEXT_CONTENT = "This is the Text message"
HTML_CONTENT = "<h1>Hello Jinja2</h1><h2>One</h2><ul><li>Foo</li><li>Bar</li><li>Qux</li></ul>"
EMAIL_TEMPLATE_NAME = "sign_up"
EMAIL_TEMPLATE_DATA = {
    "verify_url": "https://testing.domain.com/verify-email/396438bb-894a-4401-8d3b-7c0d22abaf5b",
    "support_email": "support@testing.domain",
}
RENDERED_EMAIL_TXT = "rendered email txt"

email_config = ConnectionConfig(
    MAIL_BACKEND=EmailBackends.DUMMY.value,
    MAIL_DEFAULT_SENDER="username@domain.name",
    MAIL_SERVER="testing.smtp.com",
    MAIL_USERNAME="username",
    MAIL_PASSWORD="password",
)
dummy_email_connection = Mail(email_config).get_connection()


async def test_send_email_ok_all_params():
    with patch("taiga.emails.tasks.send_email_message", autospec=True) as fake_send_email_message, patch(
        "taiga.emails.tasks.render_email_txt", return_value=TEXT_CONTENT
    ), patch("taiga.emails.tasks.render_email_html", return_value=HTML_CONTENT), patch(
        "taiga.emails.tasks.render_subject", return_value=SUBJECT
    ), tempfile.NamedTemporaryFile(
        mode="wb"
    ) as jpg, tempfile.NamedTemporaryFile(
        mode="wb"
    ) as txt:

        await send_email(
            email_name=EMAIL_TEMPLATE_NAME,
            email_data=EMAIL_TEMPLATE_DATA,
            to=TO_EMAILS,
            attachment_paths=[txt.name, jpg.name],
        )

        fake_send_email_message.assert_called_once_with(
            subject=SUBJECT,
            to_emails=TO_EMAILS,
            text_content=TEXT_CONTENT,
            html_content=HTML_CONTENT,
            attachment_paths=[txt.name, jpg.name],
        )


async def test_send_email_ok_single_recipient():
    with patch("taiga.emails.tasks.send_email_message", autospec=True) as fake_send_email_message, patch(
        "taiga.emails.tasks.render_email_txt", return_value=TEXT_CONTENT
    ), patch("taiga.emails.tasks.render_email_html", return_value=HTML_CONTENT), patch(
        "taiga.emails.tasks.render_subject", return_value=SUBJECT
    ):

        await send_email(email_name=EMAIL_TEMPLATE_NAME, email_data=EMAIL_TEMPLATE_DATA, to=TO_EMAILS[0])

        fake_send_email_message.assert_called_once_with(
            subject=SUBJECT,
            to_emails=[TO_EMAILS[0]],
            text_content=TEXT_CONTENT,
            html_content=HTML_CONTENT,
            attachment_paths=[],
        )


async def test_send_email_no_recipients():
    with patch("taiga.emails.tasks.send_email_message", autospec=True) as fake_send_email_message:
        await send_email(email_name=EMAIL_TEMPLATE_NAME, email_data=EMAIL_TEMPLATE_DATA, to=TO_EMAILS[0])

        assert not fake_send_email_message.assert_awaited()


async def test_send_email_wrong_template():
    with patch("taiga.emails.tasks.send_email_message", autospec=True), pytest.raises(EmailTemplateError):

        await send_email(email_name="not_a_valid_email_template", email_data=EMAIL_TEMPLATE_DATA, to=TO_EMAILS[0])


async def test_send_email_wrong_attachments():
    with patch("taiga.emails.tasks.send_email_message", autospec=True, side_effect=FileNotFoundError()), pytest.raises(
        EmailAttachmentError
    ):

        await send_email(
            email_name=EMAIL_TEMPLATE_NAME,
            email_data=EMAIL_TEMPLATE_DATA,
            to=TO_EMAILS,
            attachment_paths=["/bad/file_path.txt"],
        )


async def test_send_email_smtp_error():
    with patch("taiga.emails.tasks.send_email_message", autospec=True, side_effect=SMTPConnectError("")), pytest.raises(
        EmailSMTPError
    ):

        await send_email(email_name=EMAIL_TEMPLATE_NAME, email_data=EMAIL_TEMPLATE_DATA, to=TO_EMAILS)


async def test_send_email_unknown_error():
    with patch("taiga.emails.tasks.send_email_message", autospec=True, side_effect=Exception()), pytest.raises(
        EmailDeliveryError
    ):

        await send_email(email_name=EMAIL_TEMPLATE_NAME, email_data=EMAIL_TEMPLATE_DATA, to=TO_EMAILS)
