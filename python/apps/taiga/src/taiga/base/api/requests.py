# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Union

from fastapi.requests import Request as RequestBase
from taiga.users.models import AnonymousUser, User


class Request(RequestBase):
    @property
    def user(self) -> Union[User, AnonymousUser]:
        return self.scope.get("user", AnonymousUser)
