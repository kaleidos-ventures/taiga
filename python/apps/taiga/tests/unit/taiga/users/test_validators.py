# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from pydantic import ValidationError
from taiga.users.validators import CreateUserValidator, UpdateUserValidator
from tests.unit.utils import check_validation_errors


def test_validate_create_user_ok_all_fields():
    email = "user@email.com"
    full_name = "User fullname"
    password = "Dragon123"
    terms = True
    project_inv_token = "eyJ0zB26LvR9jQw7"
    accept_project_invitation = False
    lang = "es_ES"

    validator = CreateUserValidator(
        email=email,
        full_name=full_name,
        password=password,
        accept_terms=terms,
        project_invitation_token=project_inv_token,
        accept_project_invitation=accept_project_invitation,
        lang=lang,
    )

    assert validator.email == email
    assert validator.full_name == full_name
    assert validator.password == password
    assert validator.accept_terms == terms
    assert validator.project_invitation_token == project_inv_token
    assert validator.accept_project_invitation == accept_project_invitation
    assert validator.lang == lang


def test_validate_create_user_wrong_not_all_required_fields():
    with pytest.raises(ValidationError) as validation_errors:
        CreateUserValidator()

    expected_error_fields = ["email", "password", "fullName", "acceptTerms"]
    expected_error_messages = ["field required"]
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)


def test_validate_create_user_not_accepted_terms():
    email = "user@email.com"
    full_name = "User fullname"
    password = "Dragon123"
    terms = False

    with pytest.raises(ValidationError) as validation_errors:
        CreateUserValidator(email=email, full_name=full_name, password=password, accept_terms=terms)

    expected_error_fields = ["acceptTerms"]
    expected_error_messages = ["User has to accept terms of service"]
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)


@pytest.mark.parametrize(
    "email",
    [
        "noAtnoDomain" "not.at.domain",
        "email@domain",
    ],
)
def test_validate_create_user_invalid_email(email):
    email = email
    full_name = "User fullname"
    password = "Dragon123"
    terms = True

    with pytest.raises(ValidationError) as validation_errors:
        CreateUserValidator(email=email, full_name=full_name, password=password, accept_terms=terms)

    expected_error_fields = ["email"]
    expected_error_messages = ["value is not a valid email address"]
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)


@pytest.mark.parametrize(
    "password",
    [
        "UPPERAndLower",
        "UPPERANDNUMBER0",
        "lowerandnumber0",
        "&/()@+01234",
        "symbol+andlower",
    ],
)
def test_validate_create_user_invalid_password(password):
    email = "user@email.com"
    full_name = "User fullname"
    terms = True

    with pytest.raises(ValidationError) as validation_errors:
        CreateUserValidator(email=email, full_name=full_name, password=password, accept_terms=terms)

    expected_error_fields = ["password"]
    expected_error_messages = ["Invalid password"]
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)


def test_validate_create_user_invalid_short_password():
    password = "SHORT"
    email = "user@email.com"
    full_name = "User fullname"
    terms = True

    with pytest.raises(ValidationError) as validation_errors:
        CreateUserValidator(email=email, full_name=full_name, password=password, accept_terms=terms)

    expected_error_fields = ["password"]
    expected_error_messages = ["ensure this value has at least 8 characters"]
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)


def test_validate_update_user_ok_all_fields():
    full_name = "User fullname"
    lang = "es_ES"

    validator = UpdateUserValidator(
        full_name=full_name,
        lang=lang,
    )

    assert validator.full_name == full_name
    assert validator.lang == lang
