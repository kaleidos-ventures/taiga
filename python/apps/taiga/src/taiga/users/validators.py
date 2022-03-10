# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import string
from collections import Counter

from pydantic import EmailStr, StrictBool, constr, validator
from taiga.base.serializer import BaseModel
from taiga.conf import settings


class CreateUserValidator(BaseModel):
    email: EmailStr
    full_name: constr(max_length=50)  # type: ignore
    password: constr(min_length=8, max_length=256)  # type: ignore
    accept_terms: StrictBool

    @validator("email", "full_name", "password")
    def check_not_empty(cls, v: str) -> str:
        assert v != "", "Empty field is not allowed"
        return v

    @validator("email")
    def check_email_in_domain(cls, v: str) -> str:
        if not settings.USER_EMAIL_ALLOWED_DOMAINS:
            return v

        domain = v.split("@")[1]
        assert domain in settings.USER_EMAIL_ALLOWED_DOMAINS, "Email domain not allowed"
        return v

    @validator("password")
    def check_password(cls, v: str) -> str:
        has_upper = len(set(string.ascii_uppercase).intersection(v)) > 0
        has_lower = len(set(string.ascii_lowercase).intersection(v)) > 0
        has_number = len(set(string.digits).intersection(v)) > 0
        has_symbol = len(set(string.punctuation).intersection(v)) > 0

        c = Counter([has_upper, has_lower, has_number, has_symbol])
        assert c[True] >= 3, "Invalid password"
        return v

    @validator("accept_terms")
    def check_accept_terms(cls, v: bool) -> bool:
        assert v is True, "User has to accept terms of service"
        return v
