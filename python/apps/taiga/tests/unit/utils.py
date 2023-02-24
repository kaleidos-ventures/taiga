# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import json

from pydantic import ValidationError


def check_validation_errors(validation_errors: ValidationError, error_fields: list[str], error_msgs: list[str]):
    validation_errors_json = json.loads(validation_errors.value.json())
    assert len(validation_errors_json) == len(error_fields), "Wrong number of validation errors"

    for error in validation_errors_json:
        if error["loc"][0] in error_fields:
            assert error["msg"] in error_msgs, f"'{error['msg']}' is not one of the expected errors {error_msgs}"
