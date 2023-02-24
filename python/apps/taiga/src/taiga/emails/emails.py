# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from enum import Enum


class Emails(Enum):
    SIGN_UP = "sign_up"
    RESET_PASSWORD = "reset_password"
    PROJECT_INVITATION = "project_invitation"
    SOCIAL_LOGIN_WARNING = "social_login_warning"


class EmailPart(Enum):
    TXT = "txt"
    HTML = "html"
    SUBJECT = "subject"
