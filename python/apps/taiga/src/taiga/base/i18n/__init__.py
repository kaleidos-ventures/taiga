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

from babel import localedata
from babel.core import Locale
from babel.support import Translations
from taiga.base.i18n import choices as i18n_choices
from taiga.base.i18n.choices import ScriptType
from taiga.base.i18n.schemas import LanguageSchema

ROOT_DIR: Final[Path] = Path(__file__).resolve().parent.parent.parent  # src/taiga
TRANSLATION_DIRECTORY: Final[Path] = ROOT_DIR.joinpath("locale")
FALLBACK_LOCALE: Final[Locale] = Locale.parse("en_US")


class I18N:
    """
    Class to manage locales, based on `babel` library.
    """

    def __init__(self) -> None:
        """
        Create I18N object and set the fallback language as the current translations.
        """
        self._translations_cache: dict[str, Translations] = {}
        self.translations = self._get_translations(str(FALLBACK_LOCALE))

    def initialize(self) -> None:
        """
        Initialize translation with the current config language.
        """
        self.reset_lang()

    def _get_locale(self, identifier: str) -> Locale:
        """
        Get a `babel.core.Locale` objects from its identifier.

        :return a `babel.core.Locale` object
        :rtype babel.core.Locale
        """
        return Locale.parse(identifier)

    def _get_translations(self, identifier: str) -> Translations:
        """
        Get a `babel.Translations` instance for some language.

        It will first try to fetch from the cache, but if it doesn't exist, it will create a new one and store it for
        future use.

        :param identifier: the language or locale identifier
        :type identifier: str
        :return a `babel.Translations` instance
        :rtype babel.Translations
        """
        locale = self._get_locale(identifier)
        translations = self._translations_cache.get(str(locale), None)

        if translations is None:
            fallback_translations = self._translations_cache.get(
                str(FALLBACK_LOCALE), Translations.load(TRANSLATION_DIRECTORY, [FALLBACK_LOCALE])
            )
            translations = Translations.load(TRANSLATION_DIRECTORY, [locale, FALLBACK_LOCALE])
            translations.add_fallback(fallback_translations)
            self._translations_cache[str(locale)] = translations

        return translations

    def set_lang(self, identifier: str) -> None:
        """
        Apply all the necessary changes to translate to a new language.

        :param identifier: the language or locale identifier
        :type identifier: str
        """
        # apply lang to shortcuts translations functions
        self.translations = self._get_translations(identifier)

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
    def use(self, identifier: str) -> Generator[None, None, None]:
        """
        Context manager to use a language and reset it at the end.

        :param identifier: the language or locale identifier
        :type identifier: str
        :return the generator instance
        :rtype Generator[None, None, None]
        """
        self.set_lang(identifier)
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
                identifier = p.parts[-1]
                locales.append(self._get_locale(identifier))

        return locales

    def is_language_available(self, identifier: str) -> bool:
        """
        Check if there is language for a concrete identifier.

        :param identifier: the language or locale identifier
        :type identifier: str
        :return true if there is a locale available for this identifier
        :rtype bool
        """
        try:
            config_locale = self._get_locale(identifier)
            return config_locale in self.locales
        except Exception:  # UnknownLocaleError, ValueError or TypeError
            return False

    @functools.cached_property
    def global_languages(self) -> list[str]:
        """
        List with the codes for all the global languages.

        :return a list of locale codes
        :rtype list[str]
        """
        locale_ids = localedata.locale_identifiers()  # type: ignore[no-untyped-call]
        locale_ids.sort()
        return locale_ids

    @functools.cached_property
    def available_languages(self) -> list[str]:
        """
        List with the codes for all the available languages.

        :return a list of locale codes
        :rtype list[str]
        """
        return [str(loc) for loc in self.locales]

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
            code = str(loc)
            script_type = i18n_choices.get_script_type(code)
            name = loc.display_name.title() if script_type is ScriptType.LATIN else loc.display_name
            english_name = loc.english_name
            text_direction = loc.text_direction
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
