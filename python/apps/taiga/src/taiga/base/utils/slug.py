# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import random
import string
from typing import Callable, Type

from slugify import slugify
from taiga.base.db.models import Model, QuerySet


def generate_int_suffix() -> str:
    """
    Generates a suffix consisting of 3 random numbers.

    :return a text suffix
    :rtype str
    """
    return f"{random.randint(0,999):03}"


def generate_chars_suffix(char_num: int = 6) -> str:
    """
    Generates a suffix consisting of n random alphanumeric characters.

    :param char_num: number of characters for the suffix. Default value is 6
    :type char_num: int
    :return a text suffix
    :rtype str
    """
    alphabet = string.ascii_letters + string.digits
    return "".join(random.choice(alphabet) for i in range(char_num))


def slugify_uniquely(value: str, model: Type[Model], slugfield: str = "slug") -> str:
    """
    Returns a slug on a name which is unique within a model's table

    :param value: base text for the slug
    :type value: str
    :param model: a django model
    :type queryset: Type[Model]
    :param slugfield: name of the field that contains the slug (default `slug`)
    :type slugfield: str
    :return a unique slug
    :rtype str
    """
    suffix = generate_chars_suffix()
    potential = base = slugify(value)
    if len(potential) == 0:
        potential = "null"
    while True:
        if suffix:
            potential = f"{base}-{suffix}"
        if not model.objects.filter(**{slugfield: potential}).exists():
            return potential
        suffix = generate_chars_suffix()


def slugify_uniquely_for_queryset(
    value: str,
    queryset: QuerySet[Model],
    slugfield: str = "slug",
    generate_suffix: Callable[..., str] = generate_int_suffix,
) -> str:
    """
    Returns a slug on a name which is unique within a Django queryset. This method adds suffix only if it is necessary.

    :param value: base text for the slug
    :type value: str
    :param queryset: a django queryset
    :type queryset: QuerySet
    :param slugfield: name of the field that contains the slug (default `slug`)
    :type slugfield: str
    :param generate_suffix: function that generates a suffix (default one returns an incremental integer)
    :type generate_suffix: Callable[..., str]
    :return a unique slug
    :rtype str
    """
    suffix = ""
    potential = base = slugify(value)
    if len(potential) == 0:
        potential = "null"
    while True:
        if suffix:
            potential = f"{base}-{suffix}"
        if not queryset.filter(**{slugfield: potential}).exists():
            return potential
        suffix = generate_suffix()
