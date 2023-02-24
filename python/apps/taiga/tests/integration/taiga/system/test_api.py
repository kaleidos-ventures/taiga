# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


import pytest
from fastapi import status

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# GET /system/languages
##########################################################


async def test_get_system_languages(client):
    response = client.get("/system/languages")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) >= 1
