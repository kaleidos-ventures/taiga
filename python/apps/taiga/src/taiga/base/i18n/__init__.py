# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import functools
import operator
from contextlib import contextmanager
from pathlib import Path
from typing import Final, Generator

from babel import UnknownLocaleError, localedata
from babel.core import Locale, get_locale_identifier, parse_locale
from babel.support import Translations
from taiga.base.i18n import choices as i18n_choices
from taiga.base.i18n.choices import ScriptType, TextDirection
from taiga.base.i18n.exceptions import UnknownLocaleIdentifierError
from taiga.base.i18n.schemas import LanguageSchema

# NOTE: There are two concepts that must be differentiated: the code and the identifier of a Locale object.
#
# - code: is the way to identify a Locale that will offer this module to anyone who decides to use it. Available codes
#   are defined at https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/availableLocales.json
# - identifier: is like a code but with `_` instead of `-` as separator. A locale object uses the identifier as a str
#   representation. The mnodule We uses the identifiers for the name of the directories where the .po files will be
#   stored.


ROOT_DIR: Final[Path] = Path(__file__).resolve().parent.parent.parent  # src/taiga
TRANSLATION_DIRECTORY: Final[Path] = ROOT_DIR.joinpath("locale")
FALLBACK_LOCALE_CODE: Final[str] = "en-US"
FALLBACK_LOCALE: Final[Locale] = Locale.parse(FALLBACK_LOCALE_CODE, sep="-")


def get_locale_code(identifier_or_locale: str | Locale) -> str:
    """
    To identify a Locale we will use its "code", defined in CLDR.core, using `"-"` as a separator. This method returns
    the code that identifies a Locale instance. Valid codes are: en, en-US or zh-Hans, for example.

    :param identifier_or_locale: a locale object or identifier (like a code but with `"_"` as separator)
    :type identifier_or_locale: str | Locale
    :return a valid Locale code
    :rtype str
    """
    return get_locale_identifier(parse_locale(str(identifier_or_locale)), sep="-")


class I18N:
    """
    Class to manage locales, based on `babel` library.
    """

    def __init__(self) -> None:
        """
        Create I18N object and set the fallback language as the current translations.
        """
        self._translations_cache: dict[str, Translations] = {}
        self.translations = self._get_translations(FALLBACK_LOCALE_CODE)

    def initialize(self) -> None:
        """
        Initialize translation with the current config language.
        """
        self.reset_lang()

    def _get_locale(self, code: str) -> Locale | None:
        """
        Get a `babel.core.Locale` objects from its code.

        The code use "-" as component separator, for example, you can use "es" or "es-ES".

        :param code: the language or locale code
        :type code: str
        :return a `babel.core.Locale` object or None
        :rtype babel.core.Locale | None
        """
        try:
            return Locale.parse(code, sep="-")
        except (ValueError, UnknownLocaleError):
            return None

    def _get_translations(self, code: str) -> Translations:
        """
        Get a `babel.Translations` instance for some language.

        It will first try to fetch from the cache, but if it doesn't exist, it will create a new one and store it for
        future use.

        The code use "-" as component separator, for example, you can use "es" or "es-ES".

        If the code is not valid or does not exist, it will throw an exception (UnknownLocaleIdentifierError).

        :param code: the language or locale code
        :type code: str
        :return a `babel.Translations` instance
        :rtype babel.Translations
        """
        new_locale = self._get_locale(code)
        if not new_locale:
            raise UnknownLocaleIdentifierError(code)
        self.locale = new_locale

        translations = self._translations_cache.get(str(self.locale), None)
        if translations is None:
            fallback_translations = self._translations_cache.get(
                str(FALLBACK_LOCALE), Translations.load(TRANSLATION_DIRECTORY, [FALLBACK_LOCALE])
            )
            translations = Translations.load(TRANSLATION_DIRECTORY, [self.locale, FALLBACK_LOCALE])
            translations.add_fallback(fallback_translations)
            self._translations_cache[str(self.locale)] = translations

        return translations

    def set_lang(self, code: str) -> None:
        """
        Apply all the necessary changes to translate to a new language.

        The code use "-" as component separator, for example, you can use "es" or "es-ES".

        :param code: the language or locale code
        :type code: str
        """
        # apply lang to shortcuts translations functions
        self.translations = self._get_translations(code)

        # apply lang to templating module
        from taiga.base.templating import env

        if "jinja2.ext.InternationalizationExtension" not in env.extensions:
            env.add_extension("jinja2.ext.i18n")

        env.install_gettext_translations(self.translations)  # type: ignore[attr-defined]

    def reset_lang(self) -> None:
        """
        Reset the object to use the current config lang.
        """
        from taiga.conf import settings

        self.set_lang(settings.LANG)

    @contextmanager
    def use(self, code: str) -> Generator[None, None, None]:
        """
        Context manager to use a language and reset it at the end.

        The code use "-" as component separator, for example, you can use "es" or "es-ES".

        :param code: the language or locale code
        :type code: str
        :return the generator instance
        :rtype Generator[None, None, None]
        """
        self.set_lang(code)
        yield
        self.reset_lang()

    @functools.cached_property
    def locales(self) -> list[Locale]:
        """
        List with all the available locales as `babel.core.Locale` objects.

        :return a list with all the available locales
        :rtype list[babel.core.Locale]
        """
        locales = []
        for p in TRANSLATION_DIRECTORY.glob("*"):
            if p.is_dir():
                code = get_locale_code(p.parts[-1])
                if locale := self._get_locale(code):
                    locales.append(locale)

        return locales

    def is_language_available(self, code: str) -> bool:
        """
        Check if there is language for a concrete code.

        The code use "-" as component separator, for example, you can use "es" or "es-ES".

        :param code: the language or locale code
        :type code: str
        :return true if there is a locale available for this code
        :rtype bool
        """
        try:
            config_locale = self._get_locale(code)
            return config_locale in self.locales
        except UnknownLocaleIdentifierError:
            return False

    @functools.cached_property
    def global_languages(self) -> list[str]:
        """
        List with the codes for all the global languages.

        :return a list of locale codes
        :rtype list[str]
        """
        locale_ids = [get_locale_code(loc_id) for loc_id in localedata.locale_identifiers()]
        locale_ids.sort()
        return locale_ids

    @functools.cached_property
    def available_languages(self) -> list[str]:
        """
        List with the codes for all the available languages.

        :return a list of locale codes
        :rtype list[str]
        """
        return [get_locale_code(loc) for loc in self.locales]

    @functools.cached_property
    def available_languages_info(self) -> list[LanguageSchema]:
        """
        List with the info for all the available languages.

        The languages order will be as follow:

        - First for the writing system (alphabet or script type) in this order: Latin, Cyrillic, Greek, Hebrew, Arabic,
          Chinese and derivatives, and others.
        - Second alphabetically for its language name.

        :return a list of `LanguageSchema` objects
        :rtype list[taiga.base.i18n.schemas.LanguageSchema]
        """
        from taiga.conf import settings

        langs: list[LanguageSchema] = []
        for loc in i18n.locales:
            code = get_locale_code(loc)
            script_type = i18n_choices.get_script_type(loc.language)
            name = (
                loc.display_name.title()
                if loc.display_name and script_type is ScriptType.LATIN
                else loc.display_name or code
            )
            english_name = loc.english_name or code
            text_direction = TextDirection(loc.text_direction)
            is_default = code == settings.LANG

            langs.append(
                LanguageSchema(
                    code=code,
                    name=name,
                    english_name=english_name,
                    text_direction=text_direction,
                    is_default=is_default,
                    script_type=script_type,
                )
            )

        langs.sort(key=operator.attrgetter("script_type", "name"))
        return langs


i18n = I18N()


# Create shortcuts for the default translations functions


def gettext(message: str) -> str:
    return i18n.translations.gettext(message)


_ = gettext


def ngettext(singular: str, plural: str, n: int) -> str:
    return i18n.translations.ngettext(singular, plural, n)


def pgettext(context: str, message: str) -> str:
    return i18n.translations.pgettext(context, message)  # type: ignore[no-untyped-call]


def npgettext(context: str, singular: str, plural: str, n: int) -> str:
    return i18n.translations.npgettext(context, singular, plural, n)  # type: ignore[no-untyped-call]
