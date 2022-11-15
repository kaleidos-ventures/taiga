# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from pydantic import ValidationError
from taiga.base.serializers import BaseModel
from taiga.base.validator import LanguageCode

#####################################################################
# LanguageCode
#####################################################################


class TestsLanguageCodeValidator(BaseModel):
    language: LanguageCode


def test_languagecode_validator_with_available_language() -> None:
    lang = "en-US"

    validator = TestsLanguageCodeValidator(language=lang)
    assert validator.language == lang


@pytest.mark.parametrize(
    "lang",
    [None, "", "xx", "en_US"],
)
def test_languagecode_validator_with_unavailable_language(lang: str | None) -> None:
    with pytest.raises(ValidationError):
        TestsLanguageCodeValidator(language=lang)
