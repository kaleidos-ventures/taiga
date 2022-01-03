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
    message: str


EX_VALIDATION_ERROR: Final = Error(
    code="validation-error", message="Unable to fulfill the request due to semantic errors"
)
EX_UNKNOWN: Final = Error(code="unknown", message="Unknown error")
EX_NOT_FOUND: Final = Error(code="not-found", message="The requested resource could not be found")
EX_AUTHORIZATION: Final = Error(
    code="authorization-error", message="Invalid token or no active account found with the given credentials"
)
EX_FORBIDDEN: Final = Error(code="forbidden-error", message="The user doesn't have permissions to perform this action")
EX_BAD_REQUEST: Final = Error(code="bad-request-error", message="The request is incorrect")
