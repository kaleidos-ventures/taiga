# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from dataclasses import dataclass
from typing import Final


@dataclass
class Error:
    code: str
    msg: str


EX_VALIDATION_ERROR: Final = Error(code="validation-error", msg="Unable to fulfill the request due to semantic errors")
EX_UNKNOWN: Final = Error(code="unknown", msg="Unknown error")
EX_NOT_FOUND: Final = Error(code="not-found", msg="The requested resource could not be found")
EX_AUTHORIZATION: Final = Error(
    code="authorization-error", msg="Invalid token or no active account found with the given credentials"
)
EX_FORBIDDEN: Final = Error(code="forbidden", msg="The user doesn't have permissions to perform this action")
EX_BAD_REQUEST: Final = Error(code="bad-request", msg="The request is incorrect")
EX_INTERNAL_SERVER_ERROR: Final = Error(code="internal-server-error", msg="Server error")
