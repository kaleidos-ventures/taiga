# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any
from urllib.parse import urljoin

from requests.utils import requote_uri


def reverse(name: str, **path_params: Any) -> str:
    """
    Reverse a route by name
    """
    from taiga.conf import settings
    from taiga.wsgi import app

    return requote_uri(
        urljoin(
            settings.BACKEND_URL,
            app.url_path_for(name, **path_params),
        )
    )
