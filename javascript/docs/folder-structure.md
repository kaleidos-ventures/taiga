
## Tree structure

├── apps
│   ├── taiga
│   │   └── src
│   │       ├── app
│   │       │   ├── [commons](#commons-module)
│   │       │   ├── [features](#features-module)
│   │       │   ├── [pages](#pages-module)
│   │       │   ├── [services](#services-module)
│   │       │   └── [styles](#styles)
│   │       ├── assets
│   │       └── environments
│   └── taiga-e2e
├── docs
└── libs
    ├── [api](#api-libs)
    ├── [core](#core-libs)
    ├── [data](#data-libs)
    ├── [ui](#ui-libs)
    └── [ws](#websocket-libs)


## Commons Module

Common modules, this means that they will be used in many components and pages or they will not be particularly attached to any page. 

## Features Module

Features modules, the folder contains features, usually with state and multiple componentes.

## Pages Module

Pages modules, the folder for every page/section.

## Services Module

Shared internal services reused across the app

## Styles

Global CSS styles, including design systems.

## Api Libs

Api module reusable services across app & libs

## Core Libs

The modules registered in core is because they're useful for Taiga & Taiga-contribs.

## Data Libs

Main data types & functions to work with data across libs & apps.

## Ui libs

For stateless & visual components.

## Websocket libs

Library for working with websockets.
