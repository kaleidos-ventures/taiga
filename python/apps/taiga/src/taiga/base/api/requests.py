# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi.requests import Request as RequestBase
from taiga.users.models import AnonymousUser, AnyUser, User


class Request(RequestBase):
    @property
    def user(self) -> AnyUser:
        return self.scope.get("user", AnonymousUser)


class AuthRequest(RequestBase):
    @property
    def user(self) -> User:
        assert self.scope.get("user") is not None, "You can only use AuthRequest in autenticathed routes."

        return self.scope["user"]
