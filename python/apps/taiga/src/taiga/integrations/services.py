# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga.base.utils import datetime
from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email


async def send_social_login_warning_email(full_name: str, email: str, login_method: str) -> None:
    context = {
        "full_name": full_name,
        "login_method": login_method,
        "login_time": datetime.aware_utcnow(),
    }
    await send_email.defer(email_name=Emails.SOCIAL_LOGIN_WARNING.value, to=email, context=context)
