# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from pydantic import ValidationError
from taiga.integrations.google.auth.validators import GoogleLoginValidator
from tests.unit.utils import check_validation_errors


def test_validate_google_login_not_available_lang():
    code = "code"
    redirect_uri = "https://redirect.uri"
    lang = "xx"

    with pytest.raises(ValidationError) as validation_errors:
        GoogleLoginValidator(code=code, redirect_uri=redirect_uri, lang=lang)

    expected_error_fields = ["lang"]
    expected_error_messages = ["Language is not available"]
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)
