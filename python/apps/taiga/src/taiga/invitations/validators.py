# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic import EmailStr, conlist, validator
from taiga.base.serializers import BaseModel
from taiga.conf import settings


class InvitationValidator(BaseModel):
    email: EmailStr
    role_slug: str

    @validator("email", "role_slug")
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


class InvitationsValidator(BaseModel):
    # Max items 50 and duplicated items not allowed
    invitations: conlist(InvitationValidator, max_items=50, unique_items=True)  # type: ignore[valid-type]

    def get_invitations_dict(self) -> list[dict[str, str]]:
        return self.dict()["invitations"]
