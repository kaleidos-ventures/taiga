# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, TypeAlias

from django.db.models import CharField, EmailField, Field, SlugField

StrOrNone: TypeAlias = str | None


class SaveAsLowerCaseMixin(Field[StrOrNone, str]):
    def get_prep_value(self, value: Any) -> Any:
        value = super().get_prep_value(value)
        if value is not None:
            return value.lower()
        return value


class LowerEmailField(EmailField[StrOrNone, str], SaveAsLowerCaseMixin):
    ...


class LowerCharField(CharField[StrOrNone, str], SaveAsLowerCaseMixin):
    ...


class LowerSlugField(SlugField[StrOrNone, str], SaveAsLowerCaseMixin):
    ...
