# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import urllib.parse
from enum import Enum
from typing import Any

from taiga.base.front.exceptions import InvalidFrontUrl
from taiga.conf import settings


class Urls(Enum):
    VERIFY_SIGNUP = "/signup/verify/{verification_token}"
    PROJECT_HOME = "/project/{project_slug}"
    PROJECT_INVITATION = "/accept-project-invitation/{invitation_token}"


def resolve_front_url(relative_uri: str, **kwargs: Any) -> str:
    try:
        front_url = Urls[relative_uri]
    except KeyError:
        raise InvalidFrontUrl(f"Theres no front-end url matching the key `{relative_uri}`")

    return urllib.parse.urljoin(settings.FRONTEND_URL, front_url.value.format(**kwargs))
