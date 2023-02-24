# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.conf import settings


def test_overwrite_settings_in_sync_test(override_settings):
    old_secret = settings.SECRET_KEY
    new_secret = "test-secret"

    assert old_secret != new_secret

    with override_settings({"SECRET_KEY": new_secret}):
        assert settings.SECRET_KEY == new_secret

    assert settings.SECRET_KEY == old_secret


async def test_overwrite_settings_in_async_test(override_settings):
    old_secret = settings.SECRET_KEY
    new_secret = "test-secret"

    assert old_secret != new_secret

    assert settings.SECRET_KEY == old_secret

    with override_settings({"SECRET_KEY": new_secret}):
        assert settings.SECRET_KEY == new_secret

    assert settings.SECRET_KEY == old_secret


async def test_overwrite_settings_mutiples_times(override_settings):
    old_secret = settings.SECRET_KEY
    new_secret = "test-secret"
    old_url = settings.BACKEND_URL
    new_url = "http://test-overwrite-settings.com"

    assert old_secret != new_secret
    assert old_url != new_url

    assert settings.SECRET_KEY == old_secret
    assert settings.BACKEND_URL == old_url

    with override_settings({"SECRET_KEY": new_secret}):
        assert settings.SECRET_KEY == new_secret
        assert settings.BACKEND_URL == old_url

    assert settings.SECRET_KEY == old_secret
    assert settings.BACKEND_URL == old_url

    with override_settings({"BACKEND_URL": new_url}):
        assert settings.SECRET_KEY == old_secret
        assert settings.BACKEND_URL == new_url

    assert settings.SECRET_KEY == old_secret
    assert settings.BACKEND_URL == old_url
