# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from django.db import models


class TelemetriesRouter:
    """
    A router to control all database operations on models in the
    collector application.
    """

    route_app_labels = {"collector", "auth", "contenttypes", "sessions"}

    def db_for_read(self, model: models.Model, **hints: dict[Any, Any]) -> str:
        if model._meta.app_label in self.route_app_labels:
            return "default"
        return "taiga"

    def db_for_write(self, model: models.Model, **hints: dict[Any, Any]) -> str | None:
        if model._meta.app_label in self.route_app_labels:
            return "default"
        return None

    def allow_migrate(self, db: str, app_label: str, model_name: str | None = None, **hints: dict[Any, Any]) -> bool:
        if app_label in self.route_app_labels:
            return db == "default"
        return False
