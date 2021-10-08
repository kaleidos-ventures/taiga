# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Final

EX_VALIDATION_ERROR: Final = {
    "code": "validation-error",
    "message": "Unable to fulfill the request due to semantic errors",
}

EX_UNKNOWN: Final = {"code": "unknown", "message": "Unknown error"}

EX_NOT_FOUND: Final = {"code": "not-found", "message": "The requested resource could not be found"}

EX_AUTHENTICATION: Final = {
    "code": "authentication-error",
    "message": "Invalid token or no active account found with the given credentials",
}
