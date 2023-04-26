# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from pydantic import conlist, validator
from taiga.base.utils.emails import is_email
from taiga.base.validators import BaseModel, StrNotEmpty
from taiga.conf import settings


class WorkspaceInvitationValidator(BaseModel):
    username_or_email: StrNotEmpty

    @validator("username_or_email")
    def check_email_in_domain(cls, v: str) -> str:
        if is_email(value=v):
            if not settings.USER_EMAIL_ALLOWED_DOMAINS:
                return v

            domain = v.split("@")[1]
            assert domain in settings.USER_EMAIL_ALLOWED_DOMAINS, "Email domain not allowed"
        return v


class WorkspaceInvitationsValidator(BaseModel):
    # Max items 50 and duplicated items not allowed
    invitations: conlist(WorkspaceInvitationValidator, max_items=50, unique_items=True)  # type: ignore[valid-type]

    def get_invitations_dict(self) -> list[dict[str, str]]:
        return self.dict()["invitations"]
