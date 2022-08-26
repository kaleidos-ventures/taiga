# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

"""
Email backend that writes text messages to console instead of sending them.
"""
from typing import Protocol

from fastapi_mailman.backends.console import EmailBackend as BaseEmailBackend  # type: ignore[import]


class Message(Protocol):
    from_email: str
    to: str
    subject: str
    body: str


class EmailBackend(BaseEmailBackend):
    def _write_separator(self, separator: str) -> None:
        self.stream.write(separator * 79)
        self.stream.write("\n")

    def write_message(self, message: Message) -> None:
        self._write_separator("=")
        self.stream.write("FROM: %s, TO: %s\n" % (message.from_email, message.to))

        self._write_separator("-")
        self.stream.write("SUBJECT: %s\n" % message.subject)

        self._write_separator("-")
        self.stream.write("%s\n" % message.body)

        self._write_separator("=")
