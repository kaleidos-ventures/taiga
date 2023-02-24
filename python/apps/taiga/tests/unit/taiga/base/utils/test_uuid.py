# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from taiga.base.utils.uuid import decode_b64str_to_uuid, encode_uuid_to_b64str


def test_encode_uuid_to_b64str():
    id = UUID("e8982c6c-6ca8-11ed-9513-1856806ac8db")
    b64id = "6JgsbGyoEe2VExhWgGrI2w"

    assert encode_uuid_to_b64str(id) == b64id


def test_decode_b64str_to_uuid():
    b64id = "6JgsbGyoEe2VExhWgGrI2w"
    id = UUID("e8982c6c-6ca8-11ed-9513-1856806ac8db")

    assert decode_b64str_to_uuid(b64id) == id
