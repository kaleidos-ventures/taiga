# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from fastapi import status
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from taiga.base.utils.strings import camel_to_kebab

from . import codes


class HTTPException(FastAPIHTTPException):
    def __init__(
        self,
        status_code: int,
        code: str = codes.EX_UNKNOWN.code,
        msg: str = "",
        detail: Any = None,
        headers: dict[str, Any] | None = None,
    ) -> None:
        self.code: str = code
        self.msg: str = msg
        if not detail:
            detail = camel_to_kebab(self.__class__.__name__)
        super().__init__(status_code=status_code, detail=detail, headers=headers)


##########################
# HTTP 400: BAD REQUEST
##########################


class BadRequest(HTTPException):
    def __init__(self, msg: str = codes.EX_BAD_REQUEST.msg, detail: Any = None) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST, code=codes.EX_BAD_REQUEST.code, msg=msg, detail=detail
        )


##########################
# HTTP 401: UNAUTHORIZED
##########################


class AuthorizationError(HTTPException):
    def __init__(self, msg: str = codes.EX_AUTHORIZATION.msg):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=codes.EX_AUTHORIZATION.code,
            msg=msg,
            headers={"WWW-Authenticate": 'Bearer realm="api"'},
        )


##########################
# HTTP 403: FORBIDDEN
##########################


class ForbiddenError(HTTPException):
    def __init__(self, msg: str = codes.EX_FORBIDDEN.msg, detail: Any = None) -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, code=codes.EX_FORBIDDEN.code, msg=msg, detail=detail)


##########################
# HTTP 404: NOT FOUND
##########################


class NotFoundError(HTTPException):
    def __init__(self, msg: str = codes.EX_NOT_FOUND.msg):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, code=codes.EX_NOT_FOUND.code, msg=msg)
