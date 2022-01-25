## Tree structure

├── apps
│   ├── taiga
│   │   └── src
│   │   ├── app
│   │   │   ├── [shared](#shared)
│   │   │   ├── [modules](#modules)
│   │   │   ├── [services](#services-module)
│   │   │   └── [styles](#styles)
│   │   ├── assets
│   │   └── environments
│   └── taiga-e2e
├── docs
└── libs
   ├── [api](#api-libs)
   ├── [core](#core-libs)
   ├── [data](#data-libs)
   ├── [ui](#ui-libs)
   └── [ws](#websocket-libs)

## Shared

The shared modules will be used in many components and pages or they will not be particularly attached to any other module.

## Modules

Here is where the main app features are. Every module must have this path `/modules/<scope>/<type>-<module-name>` or `/modules/<type>-<module-name>`

Scope:

An app-specific scope, for example, `projects`, `users` or `auth`. It's optional if the modules is not related with others can be by itself.

Types:

`feature`: Features may be pages that can have a state and router configuration. A feature get their data from their `data-access`. Also a feature can be a complex component with a other component as children. A feature may import other features.

`data-access`: Interact with the api an store the data in a ngrx feature state.

Example with group scope:

`/modules/projects/data-access`, ProjectsDataAccessModule
`/modules/projects/feature-list`, ProjectsFeatureListModule

Example without group scope:

`/modules/data-access-auth`, DataAccessAuthModule
`/modules/feature-auth`, FeatureAuthModule

└── modules
└── projects
├── data-access
| ├── +state
| │   ├── actions
| │   ├── effects
| │   ├── reducers
| │   └── selectors
| └── projects-data-access.module.ts
├── feature-settings
└── feature-list
├── +state (only if the feature needs a state for the UI)
│   ├── actions
│   ├── effects
│   ├── reducers
│   └── selectors
├── components
│   └── example
│   ├── example.component.module.ts
│   ├── example.component.html
│   ├── example.component.css
│   ├── example.component.spec.ts
│   └── example.service.ts
├── models
│   └── example.model.ts
├── styles
│   └── project-settings.css
├── services
│   └── example
│   ├── example.service.ts
│   └── example.service.spec.ts
├── projects-feature-list.component.ts
├── projects-feature-list.component.html
├── projects-feature-list-routing.module.ts
└── projects-feature-list.module.ts

## Services Module

Global internal services reused across the app

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
