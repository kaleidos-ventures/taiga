# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from pydantic import EmailStr, StrictBool, conint, constr, validator
from taiga.base.validators import BaseModel, LanguageCode
from taiga.conf import settings
from taiga.users.api.validators.mixins import PasswordMixin

#####################################################################
# User
#####################################################################


class CreateUserValidator(PasswordMixin, BaseModel):
    email: EmailStr
    full_name: constr(max_length=50)  # type: ignore
    accept_terms: StrictBool
    color: conint(gt=0, lt=9) | None = None  # type: ignore
    lang: LanguageCode | None
    project_invitation_token: str | None
    workspace_invitation_token: str | None
    accept_project_invitation: StrictBool = True
    accept_workspace_invitation: StrictBool = True

    @validator("email", "full_name")
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

    @validator("accept_terms")
    def check_accept_terms(cls, v: bool) -> bool:
        assert v is True, "User has to accept terms of service"
        return v


class UpdateUserValidator(BaseModel):
    full_name: constr(max_length=50)  # type: ignore
    lang: LanguageCode

    @validator("full_name", "lang")
    def check_not_empty(cls, v: str) -> str:
        assert v != "", "Empty field is not allowed"
        return v


class VerifyTokenValidator(BaseModel):
    token: str


#####################################################################
# Reset Password
#####################################################################


class RequestResetPasswordValidator(BaseModel):
    email: EmailStr


class ResetPasswordValidator(PasswordMixin, BaseModel):
    ...
