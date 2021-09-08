# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import inspect
import typing
from datetime import datetime
from typing import Any, Set, Type, Union, get_type_hints

from sampledata.helper import SampleData
from taiga.base.serializer import BaseModel

MAX_NESTED_INDEX = 5
MIN_LIST_LENGTH = 2
MAX_LIST_LENGTH = 5
# probability for an Optional type to be `None` (1-100)
OPTIONAL_NONE_PROB = 50

SAMPLE_DATA = SampleData()
# Customize your own Sampledata's methods: https://sampledata.readthedocs.io/en/latest/sampledata.html#time-methods
SAMPLEDATA_DEFAULT_METHODS = {
    "str": "words(3)",
    "int": "digits(5)",
    "bool": "boolean()",
    "datetime": "datetime(begin=-9999, end=9999)",
}


def mock_serializer(
    base_model_class: Type[BaseModel],
    current_nested_index: dict[str, int] = dict(),
    parent_props: dict[str, Set[Any]] = dict(),
) -> Type[BaseModel]:
    properties = get_type_hints(base_model_class)
    properties_dict: dict[str, Any] = {}

    for property, type in properties.items():
        if property not in current_nested_index:
            current_nested_index.setdefault(property, 0)

        type_is_optional = _is_optional(type)
        if type_is_optional:
            # take either None or the optional's type, as the new type
            if SAMPLE_DATA.int(0, 100) < OPTIONAL_NONE_PROB:
                properties_dict[property] = None
                continue
            else:
                type = type.__args__[0]

        if _is_base_model_type(type):
            if _is_nested_property(parent_props, property, type) and current_nested_index[property] < MAX_NESTED_INDEX:
                # circular nested properties detected, allow recursion!
                parent_props.setdefault(property, set()).add(type)
                current_nested_index[property] += 1
                properties_dict[property] = mock_serializer(type, current_nested_index, parent_props)

            elif (
                _is_nested_property(parent_props, property, type)
                and current_nested_index[property] >= MAX_NESTED_INDEX
                and type_is_optional
            ):
                # maximum cycle index detected, stop recursion!
                properties_dict[property] = None
                continue

            else:
                # recursion allowed, or forced iteration (searching for an Optional field to exit recursion)
                parent_props.setdefault(property, set()).add(type)
                current_nested_index[property] += 1
                properties_dict[property] = mock_serializer(type, current_nested_index, parent_props)

        if _is_simple(type):
            properties_dict[property] = _get_simple_random(type)

        if typing.get_origin(type) is list:
            list_range = range(SAMPLE_DATA.int(MIN_LIST_LENGTH, MAX_LIST_LENGTH))
            properties_dict[property] = []
            for count in list_range:
                if not issubclass(typing.get_args(type)[0], BaseModel):
                    properties_dict[property].append(_get_simple_random(typing.get_args(type)[0]))
                elif current_nested_index[property] < MAX_NESTED_INDEX:
                    parent_props.setdefault(property, set()).add(type)
                    current_nested_index[property] += 1
                    properties_dict[property].append(
                        mock_serializer(typing.get_args(type)[0], current_nested_index, parent_props)
                    )

    mocked_object: Type[BaseModel] = base_model_class(**properties_dict)

    return mocked_object


def _is_nested_property(parent_props: dict[str, Any], property: str, type: Type[Any]) -> bool:
    return property in parent_props.keys() and type in parent_props[property]


def _is_optional(type: Type[Any]) -> bool:
    return typing.get_origin(type) is Union and len(type.__args__) == 2


def _is_base_model_type(type: Type[Any]) -> bool:
    return inspect.isclass(type) and issubclass(type, BaseModel)


def _is_simple(type: Type[Any]) -> bool:
    return type is str or type is int or type is bool or type is datetime or type is dict


def _get_simple_random(type: Type[Any]) -> Any:
    # TODO: type is in [str, int]
    if type is str or type is int or type is bool or type is datetime:
        return eval("SAMPLE_DATA." + SAMPLEDATA_DEFAULT_METHODS[type.__name__])
    if type is dict:
        return dict()
