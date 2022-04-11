# How to add new routes to the API

## New router (url)

To add a new router (url) to the API, you should:
- add the url and its metadata to `routers/routes.py`
- include the new router in `routers/loader.py`


## New `api.py` file

When adding a new `api.py` file, you should import it from `routers/loader.py` following the other imports. This way the new api endpoints are loaded before including the routers in the fastapi application.
