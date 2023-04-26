# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from enum import Enum
from typing import Any
from urllib.parse import urlencode, urljoin

from taiga.base.front.exceptions import InvalidFrontUrl
from taiga.conf import settings


class Urls(Enum):
    PROJECT_HOME = "/project/{project_id}"
    PROJECT_INVITATION = "/accept-project-invitation/{invitation_token}"
    PROJECT_INVITATION_PREVIEW = "/project/{project_id}/preview/{invitation_token}"
    RESET_PASSWORD = "/reset-password/{reset_password_token}"
    VERIFY_SIGNUP = "/signup/verify/{verification_token}"
    WORKSPACE_INVITATION = "/accept-workspace-invitation/{invitation_token}"


def resolve_front_url(url_key: str, query_params: dict[str, str] | None = None, **kwargs: Any) -> str:
    try:
        url_pattern = Urls[url_key]
    except KeyError:
        raise InvalidFrontUrl(f"Theres no front-end url matching the key `{url_key}`")

    url = urljoin(settings.FRONTEND_URL, url_pattern.value.format(**kwargs))

    if query_params:
        return f"{url}?{urlencode(query_params)}"

    return url
