# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from django.conf import settings
from django.urls.resolvers import URLPattern, URLResolver

urlpatterns: list[URLPattern | URLResolver] = []


if settings.DEBUG:
    from django.contrib import admin
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    from django.urls import path, re_path

    ##############################################
    # Admin panel
    ##############################################

    urlpatterns += [
        path("admin/", admin.site.urls),
    ]

    ##############################################
    # Media files
    ##############################################

    def mediafiles_urlpatterns(prefix: str) -> list[URLPattern]:
        """
        Method for serve media files with runserver.
        """
        import re

        from django.views.static import serve

        return [
            re_path(r"^%s(?P<path>.*)$" % re.escape(prefix.lstrip("/")), serve, {"document_root": settings.MEDIA_ROOT})
        ]

    urlpatterns += mediafiles_urlpatterns(prefix="/media/")

    ##############################################
    # Static files
    ##############################################

    urlpatterns += staticfiles_urlpatterns(prefix="/static/")
