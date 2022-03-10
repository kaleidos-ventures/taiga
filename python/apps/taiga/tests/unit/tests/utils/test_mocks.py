# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
#
# The code is partially taken (and modified) from djangorestframework-simplejwt v. 4.7.1
# (https://github.com/jazzband/djangorestframework-simplejwt/tree/5997c1aee8ad5182833d6b6759e44ff0a704edb4)
# that is licensed under the following terms:

from tests.utils import mocks


@mocks.override_settings({"SECRET_KEY": "test-secret"})
def test_overwrite_settings_as_decorator_in_sync_test():
    from taiga.conf import settings

    assert settings.SECRET_KEY == "test-secret"


def test_overwrite_settings_as_contextmanager_in_sync_test():
    from taiga.conf import settings

    old_secret = settings.SECRET_KEY

    with mocks.override_settings({"SECRET_KEY": "test-secret"}):
        from taiga.conf import settings

        assert settings.SECRET_KEY == "test-secret"
        assert settings.SECRET_KEY != old_secret

    from taiga.conf import settings

    assert settings.SECRET_KEY == old_secret


async def test_overwrite_settings_as_contextmanager_in_async_test():
    from taiga.conf import settings

    old_secret = settings.SECRET_KEY

    with mocks.override_settings({"SECRET_KEY": "test-secret"}):
        from taiga.conf import settings

        assert settings.SECRET_KEY == "test-secret"
        assert settings.SECRET_KEY != old_secret

    from taiga.conf import settings

    assert settings.SECRET_KEY == old_secret
