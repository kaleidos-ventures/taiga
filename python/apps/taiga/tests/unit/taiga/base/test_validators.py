# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from uuid import UUID

import pytest
from pydantic import ValidationError
from taiga.base.serializers import BaseModel
from taiga.base.validators import B64UUID, LanguageCode

#####################################################################
# LanguageCode
#####################################################################


class LanguageCodeValidator(BaseModel):
    language: LanguageCode


def test_languagecode_validator_with_available_language() -> None:
    lang = "en-US"

    validator = LanguageCodeValidator(language=lang)
    assert validator.language == lang


@pytest.mark.parametrize(
    "lang",
    [None, "", "xx", "en_US"],
)
def test_languagecode_validator_with_unavailable_language(lang: str | None) -> None:
    with pytest.raises(ValidationError):
        LanguageCodeValidator(language=lang)


#####################################################################
# B64UUID
#####################################################################


class B64UUIDValidator(BaseModel):
    b64id: B64UUID


@pytest.mark.parametrize(
    "b64id, result",
    [
        ("", None),
        ("6Jgsbshort", None),
        ("@#!", None),
        ("6JgsbGyoEe2VExhWgGrI2w", UUID("e8982c6c-6ca8-11ed-9513-1856806ac8db")),
    ],
)
def test_b64id(b64id: str | None, result: UUID | None):
    validator = B64UUIDValidator(b64id=b64id)
    assert validator.b64id == result
