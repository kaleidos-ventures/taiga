# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from fastapi.routing import APIRoute
from starlette.middleware import Middleware


def MiddlewareAPIRouteWrapper(middleware: list[Middleware] | None = None) -> type[APIRoute]:
    """
    Just bind the middleware to an APIRoute subclass.

    NOTE: This code is based on https://github.com/tiangolo/fastapi/issues/1174#issuecomment-905851468
          and there is an unmerged PR (https://github.com/encode/starlette/pull/1286) to integrate this
          behaviour in Starlette.
    """

    class CustomAPIRoute(APIRoute):
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            super().__init__(*args, **kwargs)
            app = self.app
            for cls, options in reversed(middleware or []):
                app = cls(app, **options)
            self.app = app

    return CustomAPIRoute
