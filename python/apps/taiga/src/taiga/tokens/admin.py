# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
#
#
# The code is partially taken (and modified) from djangorestframework-simplejwt v. 4.7.1
# (https://github.com/jazzband/djangorestframework-simplejwt/tree/5997c1aee8ad5182833d6b6759e44ff0a704edb4)
# that is licensed under the following terms:
#
#   Copyright 2017 David Sanders
#
#   Permission is hereby granted, free of charge, to any person obtaining a copy of
#   this software and associated documentation files (the "Software"), to deal in
#   the Software without restriction, including without limitation the rights to
#   use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
#   of the Software, and to permit persons to whom the Software is furnished to do
#   so, subject to the following conditions:
#
#   The above copyright notice and this permission notice shall be included in all
#   copies or substantial portions of the Software.
#
#   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
#   SOFTWARE.

from datetime import datetime
from typing import Sequence
from uuid import UUID

from taiga.base.db import admin
from taiga.base.db.admin.http import HttpRequest
from taiga.base.db.models import ContentType
from taiga.tokens.models import DenylistedToken, OutstandingToken


@admin.register(OutstandingToken)
class OutstandingTokenAdmin(admin.ModelAdmin[OutstandingToken]):
    list_display = (
        "token_type",
        "jti",
        "content_type",
        "object_id",
        "created_at",
        "expires_at",
    )
    search_fields = (
        "token_type",
        "content_type",
        "object_id",
        "jti",
    )
    ordering = (
        "token_type",
        "content_type",
        "object_id",
    )
    actions = None

    def get_readonly_fields(self, request: HttpRequest, obj: OutstandingToken | None = None) -> Sequence[str]:
        return [f.name for f in self.model._meta.fields]

    def has_add_permission(self, request: HttpRequest, obj: OutstandingToken | None = None) -> bool:
        return False

    def has_delete_permission(self, request: HttpRequest, obj: OutstandingToken | None = None) -> bool:
        return False

    def has_change_permission(self, request: HttpRequest, obj: OutstandingToken | None = None) -> bool:
        return request.method in ["GET", "HEAD"] and super().has_change_permission(request, obj)  # noqa: W504


@admin.register(DenylistedToken)
class DenylistedTokenAdmin(admin.ModelAdmin[DenylistedToken]):
    list_display = (
        "token_token_type",
        "token_jti",
        "token_content_type",
        "token_object_id",
        "token_created_at",
        "token_expires_at",
        "denylisted_at",
    )
    search_fields = (
        "token__token_type",
        "token__content_type",
        "token__object_id",
        "token__jti",
    )
    ordering = (
        "token__token_type",
        "token__content_type",
        "token__object_id",
    )

    @admin.display(description="token type", ordering="token__token_type")
    def token_token_type(self, obj: DenylistedToken) -> str:
        return obj.token.token_type

    @admin.display(description="jti", ordering="token__jti")
    def token_jti(self, obj: DenylistedToken) -> str:
        return obj.token.jti

    @admin.display(description="content type", ordering="token__content_type")
    def token_content_type(self, obj: DenylistedToken) -> ContentType | None:
        return obj.token.content_type

    @admin.display(description="object id", ordering="token__object_id")
    def token_object_id(self, obj: DenylistedToken) -> UUID | None:
        return obj.token.object_id

    @admin.display(description="created at", ordering="token__created_at")
    def token_created_at(self, obj: DenylistedToken) -> datetime | None:
        return obj.token.created_at

    @admin.display(description="expires at", ordering="token__expires_at")
    def token_expires_at(self, obj: DenylistedToken) -> datetime:
        return obj.token.expires_at
