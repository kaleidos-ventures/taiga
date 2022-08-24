# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

"""
Email backend that writes text messages to console instead of sending them.
"""

from fastapi_mailman.backends.console import EmailBackend as BaseEmailBackend


class EmailBackend(BaseEmailBackend):
    def write_message(self, message):
        msg_data = message.body
        self.stream.write("%s\n" % msg_data)
        self.stream.write("-" * 79)
        self.stream.write("\n")
