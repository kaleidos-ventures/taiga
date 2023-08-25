# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
import pytest
from taiga.base.validators.fields.file import MaxFileSizeExcededError, MaxFileSizeValidator
from tests.utils import factories as f

###########################################################
# MaxFileSizeValidator
###########################################################


def test_max_file_size_validator_with_valid_value():
    file = f.build_string_uploadfile()
    validator = MaxFileSizeValidator(max_size=1000)
    assert validator(file) == file


def test_upload_file_with_invalid_value():
    with pytest.raises(MaxFileSizeExcededError):
        file = f.build_string_uploadfile()
        validator = MaxFileSizeValidator(max_size=5)
        validator(file)
