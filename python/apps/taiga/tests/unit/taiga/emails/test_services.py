# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import tempfile
from unittest.mock import AsyncMock, Mock, patch

from fastapi_mailman import Mail
from fastapi_mailman.config import ConnectionConfig
from taiga.conf.emails import EmailBackends
from taiga.emails.sender import send_email_message

SUBJECT = "Email sent from FastPI-Mailman"
TO_EMAILS = ["username1@domain.name", "username2@domain.name"]
FROM_EMAIL = "username@domain.name"
BODY_TXT = "This is the Text message"
BODY_HTML = "<h1>Hello Jinja2</h1><h2>One</h2><ul><li>Foo</li><li>Bar</li><li>Qux</li></ul>"

email_config = ConnectionConfig(
    MAIL_BACKEND=EmailBackends.DUMMY.value,
    MAIL_DEFAULT_SENDER="username@domain.name",
    MAIL_SERVER="testing.smtp.com",
    MAIL_USERNAME="username",
    MAIL_PASSWORD="password",
)
dummy_email_connection = Mail(email_config).get_connection()


# TODO: mock EMAIL settings variables using utils.mock.override_settings
# TODO: include all called/awaited asserts in one unique test method (mocking the EmailMultiAlternatives constructor)
async def test_email_message_creation():
    with patch("taiga.emails.sender.EmailMultiAlternatives", autospec=True) as fake_email_message, patch(
        "taiga.emails.sender._get_mail_connection", return_value=dummy_email_connection
    ):

        await send_email_message(
            subject=SUBJECT,
            to_emails=TO_EMAILS,
            from_email=FROM_EMAIL,
            body_txt=BODY_TXT,
        )

        fake_email_message.assert_called_once_with(
            connection=dummy_email_connection, subject=SUBJECT, to=TO_EMAILS, from_email=FROM_EMAIL, body=BODY_TXT
        )


async def test_email_message_attach_alternative():
    with patch(
        "taiga.emails.sender.EmailMultiAlternatives.attach_alternative", new_callable=Mock
    ) as fake_email_message_alternative, patch(
        "taiga.emails.sender._get_mail_connection", return_value=dummy_email_connection
    ):
        await send_email_message(
            subject=SUBJECT,
            to_emails=TO_EMAILS,
            from_email=FROM_EMAIL,
            body_txt=BODY_TXT,
            body_html=BODY_HTML,
        )

        fake_email_message_alternative.assert_called_once_with(BODY_HTML, "text/html")


async def test_email_message_attach_file():
    with patch(
        "taiga.emails.sender.EmailMultiAlternatives.attach_file", new_callable=Mock
    ) as fake_email_message_files, tempfile.NamedTemporaryFile(mode="wb") as jpg, tempfile.NamedTemporaryFile(
        mode="wb"
    ) as txt, patch(
        "taiga.emails.sender._get_mail_connection", return_value=dummy_email_connection
    ):

        await send_email_message(
            subject=SUBJECT,
            to_emails=TO_EMAILS,
            from_email=FROM_EMAIL,
            body_txt=BODY_TXT,
            attachment_paths=[txt.name, jpg.name],
        )

        fake_email_message_files.assert_called_with(path=jpg.name)


async def test_send_email_message():
    with patch("taiga.emails.sender.EmailMultiAlternatives.send", new_callable=AsyncMock) as fake_message_send, patch(
        "taiga.emails.sender._get_mail_connection", return_value=dummy_email_connection
    ):
        await send_email_message(
            subject=SUBJECT,
            to_emails=TO_EMAILS,
            from_email=FROM_EMAIL,
            body_txt=BODY_TXT,
        )

        fake_message_send.assert_awaited_once()
