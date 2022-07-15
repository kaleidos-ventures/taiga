# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import random
import string
from typing import Type

from django.db.models import Model
from slugify import slugify


def generate_int_suffix() -> str:
    return f"{random.randint(0,999):03}"


def _generate_suffix() -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(random.choice(alphabet) for i in range(6))


def slugify_uniquely(value: str, model: Type[Model], slugfield: str = "slug") -> str:
    """
    Returns a slug on a name which is unique within a model's table
    """
    suffix = _generate_suffix()
    potential = base = slugify(value)
    if len(potential) == 0:
        potential = "null"
    while True:
        if suffix:
            potential = "-".join([base, str(suffix)])
        if not model.objects.filter(**{slugfield: potential}).exists():
            return potential
        suffix = _generate_suffix()
