# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from datetime import datetime
from typing import Optional

import pytest
from taiga.base.mocks import MAX_LIST_LENGTH, MAX_NESTED_INDEX, MIN_LIST_LENGTH, mock_serializer
from taiga.base.serializer import BaseModel


class SimpleModel(BaseModel):
    text: str
    num: int
    boolean: bool
    date_hour: datetime
    dictionary: dict


class ListsModel(BaseModel):
    num_list: list[int]
    text_list: list[str]
    boolean_list: list[bool]
    datetime_list: list[datetime]
    dict_list: list[dict]
    simple_model_list: list[SimpleModel]


class NestedModel1(BaseModel):
    foo: Optional["NestedModel2"]
    bar: SimpleModel

    class Config:
        orm_mode = False


class NestedModel2(BaseModel):
    foo: Optional["NestedModel3"]
    bar: SimpleModel

    class Config:
        orm_mode = False


class NestedModel3(BaseModel):
    foo: Optional["NestedModel1"]
    bar: SimpleModel

    class Config:
        orm_mode = False


class OptionalModel(BaseModel):
    foo: Optional[SimpleModel]
    bar: int

    class Config:
        orm_mode = False


NestedModel1.update_forward_refs()
NestedModel2.update_forward_refs()


def testing_simple_types():
    mocked_object = mock_serializer(SimpleModel)
    _validate_simple_model(mocked_object)


# TODO: fix _is_base_model_type in base/mocks
@pytest.mark.skip(reason="fix _is_base_model_type in base/mocks")
def testing_mocked_list_fields():
    mocked_object = mock_serializer(ListsModel)

    _validate_list(mocked_object.simple_model_list, SimpleModel)
    for simple_model in mocked_object.simple_model_list:
        _validate_simple_model(simple_model)


def testing_optional_field():
    mocked_object = mock_serializer(OptionalModel)

    _validate_optional(type(mocked_object.foo))


def testing_nested_cycling_properties():
    mocked_object = mock_serializer(NestedModel1)

    _validate_nested_cyclic(mocked_object.foo)
    _validate_simple_model(mocked_object.bar)


def testing_list_of_base_model():
    mocked_object_list = mock_serializer(list[SimpleModel])

    _validate_list(mocked_object_list, SimpleModel)


def _validate_simple_model(mocked_object):
    _validate_text(mocked_object.text)
    _validate_num(mocked_object.num)
    _validate_bool(mocked_object.boolean)
    _validate_dictionary(mocked_object.dictionary)
    _validate_datetime(mocked_object.date_hour)


def _validate_list(list_2_test: str, list_type: type):
    assert isinstance(list_2_test, list)
    assert len(list_2_test) >= MIN_LIST_LENGTH
    assert len(list_2_test) <= MAX_LIST_LENGTH
    for list_item in list_2_test:
        assert isinstance(list_item, list_type)


def _validate_optional(mocked_object):
    assert mocked_object == type(None) or mocked_object == SimpleModel  # noqa: E721


def _validate_nested_cyclic(mocked_object, nested_index: int = 0):
    if mocked_object is not None and nested_index <= MAX_NESTED_INDEX:
        assert nested_index <= MAX_NESTED_INDEX
        _validate_nested_cyclic(mocked_object.foo, nested_index + 1)


def _validate_text(text: str):
    assert isinstance(text, str)
    assert len(text) >= 1


def _validate_num(num: int):
    assert isinstance(num, int)
    assert num >= 0


def _validate_bool(boolean: bool):
    assert isinstance(boolean, bool)
    assert boolean in [True, False]


def _validate_datetime(date_hour: datetime):
    assert isinstance(date_hour, datetime)
    assert len(date_hour.__str__()) == 32


def _validate_dictionary(dictionary: datetime):
    assert isinstance(dictionary, dict)
    assert dictionary == dict()
