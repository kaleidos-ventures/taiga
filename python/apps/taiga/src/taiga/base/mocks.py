# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import inspect
import random
import typing
from datetime import datetime
from typing import Any, Union, get_type_hints

from faker import Faker
from taiga.base.serializers import BaseModel

MAX_NESTED_INDEX = 5
MIN_LIST_LENGTH = 2
MAX_LIST_LENGTH = 5
# The probability for an Optional type to be `None` (1 to 100)
OPTIONAL_NONE_PROB = 50

SAMPLE_DATA = Faker()
SAMPLE_DATA.seed_instance(1)
random.seed(1)

# Choose your Sampledata's methods from here:
#   https://sampledata.readthedocs.io/en/latest/sampledata.html#time-methods
SAMPLEDATA_DEFAULT_METHODS = {
    "str": "word()",
    "int": "port_number()",
    "bool": "boolean()",
    "datetime": "date_time()",
}


def mock_serializer(serialized_type: Any) -> BaseModel | list[BaseModel]:
    """
    Construct mocked objects for any of the allowed types

    :serialized_type: The 'BaseModel' or 'list[BaseModel]' type to mock
    """
    if typing.get_origin(serialized_type) is list:
        ret_list = list()
        for _ in range(random.randint(MIN_LIST_LENGTH, MAX_LIST_LENGTH)):
            ret_list.append(base_model_mock_serializer(typing.get_args(serialized_type)[0]))
        return ret_list
    return base_model_mock_serializer(serialized_type)


def base_model_mock_serializer(
    serialized_type: type[BaseModel],
    current_nested_index: dict[str, int] = dict(),
    parent_props: dict[str, set[Any]] = dict(),
) -> BaseModel:
    """
    Construct mocked objects for the provided BaseModel type

    :serialized_type: The 'BaseModel' type to mock
    :current_nested_index: Internal field to control recursion indexes
    :parent_props: Internal field to control previous recursion points
    """
    properties = get_type_hints(serialized_type)
    properties_dict: dict[str, Any] = {}

    for prop, prop_type in properties.items():
        if prop not in current_nested_index:
            current_nested_index.setdefault(prop, 0)

        type_is_optional = _is_optional(prop_type)
        if type_is_optional:
            # take either None or the optional's type, as the new type
            if random.randint(0, 100) < OPTIONAL_NONE_PROB:
                properties_dict[prop] = None
                continue
            else:
                prop_type = prop_type.__args__[0]

        if _is_base_model_type(prop_type):
            if _is_nested_property(parent_props, prop, prop_type) and current_nested_index[prop] < MAX_NESTED_INDEX:
                # circular nested properties detected, allow recursion!
                parent_props.setdefault(prop, set()).add(prop_type)
                current_nested_index[prop] += 1
                properties_dict[prop] = base_model_mock_serializer(prop_type, current_nested_index, parent_props)
                current_nested_index[prop] -= 1

            elif (
                _is_nested_property(parent_props, prop, prop_type)
                and current_nested_index[prop] >= MAX_NESTED_INDEX
                and type_is_optional
            ):
                # maximum cycle index detected, stop recursion!
                properties_dict[prop] = None
                continue

            else:
                # recursion allowed, or forced iteration (searching for an Optional field to exit recursion)
                parent_props.setdefault(prop, set()).add(prop_type)
                current_nested_index[prop] += 1
                properties_dict[prop] = base_model_mock_serializer(prop_type, current_nested_index, parent_props)
                current_nested_index[prop] -= 1

        if _is_simple(prop_type):
            properties_dict[prop] = _get_simple_random(prop_type)

        if typing.get_origin(prop_type) is list:
            list_range = range(random.randint(MIN_LIST_LENGTH, MAX_LIST_LENGTH))
            properties_dict[prop] = []
            for count in list_range:
                if not issubclass(typing.get_args(prop_type)[0], BaseModel):
                    properties_dict[prop].append(_get_simple_random(typing.get_args(prop_type)[0]))
                elif current_nested_index[prop] < MAX_NESTED_INDEX:
                    parent_props.setdefault(prop, set()).add(prop_type)
                    current_nested_index[prop] += 1
                    properties_dict[prop].append(
                        base_model_mock_serializer(typing.get_args(prop_type)[0], current_nested_index, parent_props)
                    )
                    current_nested_index[prop] -= 1

    return serialized_type(**properties_dict)


def _is_nested_property(parent_props: dict[str, Any], property: str, type: type[Any]) -> bool:
    return property in parent_props.keys() and type in parent_props[property]


def _is_optional(type: type[Any]) -> bool:
    return typing.get_origin(type) is Union and len(type.__args__) == 2


def _is_base_model_type(type: type[Any]) -> bool:
    return inspect.isclass(type) and issubclass(type, BaseModel)


def _is_simple(type: type[Any]) -> bool:
    return type is str or type is int or type is bool or type is datetime or type is dict


def _get_simple_random(type: type[Any]) -> Any:
    # TODO: type is in [str, int]
    if type is str or type is int or type is bool or type is datetime:
        return eval("SAMPLE_DATA." + SAMPLEDATA_DEFAULT_METHODS[type.__name__])
    if type is dict:
        return dict()
