# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from pydantic import EmailStr, conlist, root_validator, validator
from taiga.base.utils.emails import is_email
from taiga.base.validators import BaseModel
from taiga.conf import settings


class ProjectInvitationValidator(BaseModel):
    email: EmailStr | None
    username: str | None
    role_slug: str

    @root_validator
    def username_or_email(cls, values: dict[str, str]) -> dict[str, str]:
        username = values.get("username")
        email = values.get("email")
        username_has_value = username is not None and username != ""
        email_has_value = email is not None and email != ""
        assert username_has_value or email_has_value, "Username or email required"
        return values

    @validator("role_slug")
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


class ProjectInvitationsValidator(BaseModel):
    # Max items 50 and duplicated items not allowed
    invitations: conlist(ProjectInvitationValidator, max_items=50, unique_items=True)  # type: ignore[valid-type]

    def get_invitations_dict(self) -> list[dict[str, str]]:
        return self.dict()["invitations"]


class RevokeProjectInvitationValidator(BaseModel):
    username_or_email: str

    @validator("username_or_email")
    def check_not_empty(cls, v: str) -> str:
        assert v != "", "Empty field is not allowed"
        return v

    @validator("username_or_email")
    def check_email_in_domain(cls, v: str) -> str:
        if is_email(value=v):
            if not settings.USER_EMAIL_ALLOWED_DOMAINS:
                return v

            domain = v.split("@")[1]
            assert domain in settings.USER_EMAIL_ALLOWED_DOMAINS, "Email domain not allowed"
        return v


class ResendProjectInvitationValidator(BaseModel):
    username_or_email: str

    @validator("username_or_email")
    def check_not_empty(cls, v: str) -> str:
        assert v != "", "Empty field is not allowed"
        return v

    @validator("username_or_email")
    def check_email_in_domain(cls, v: str) -> str:
        if is_email(value=v):
            if not settings.USER_EMAIL_ALLOWED_DOMAINS:
                return v

            domain = v.split("@")[1]
            assert domain in settings.USER_EMAIL_ALLOWED_DOMAINS, "Email domain not allowed"
        return v


class UpdateProjectInvitationValidator(BaseModel):
    role_slug: str

    @validator("role_slug")
    def check_not_empty(cls, v: str) -> str:
        assert v != "", "Empty field is not allowed"
        return v
