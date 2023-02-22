# API Serialization and typing

## Rationale

The API may return pure ORM objects or complex objects with annotations and calculated data. Both scenarios are dealt in a different way:
1. for pure ORM objects, Django objects, the API return directly the object as they are mapped 1to1 with the response. The service called from the API will return the Django object. For instance, ProjectInvitation.
2. for complex objects, the API returns a Pydantic Serializer. The service called from the API will return the serializer. For instance, ProjectDetailSerializer.

In the first case, we'll have:
```python
@routes.projects.patch(
    "/{project_id}/invitations/{id}",
    name="project.invitations.update",
    summary="Update project invitation",
    response_model=ProjectInvitationSerializer,
    responses=ERROR_422 | ERROR_400 | ERROR_404 | ERROR_403,
)
async def update_project_invitation(
    request: AuthRequest,
    form: UpdateProjectInvitationValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    id: UUID = Query(None, description="the invitation id (int)"),
) -> ProjectInvitation:
    """
    Update project invitation
    """
    invitation = await get_project_invitation_by_id_or_404(project_id=project_id, id=id)
    await check_permissions(permissions=UPDATE_PROJECT_INVITATION, user=request.user, obj=invitation)

    return await invitations_services.update_project_invitation(invitation=invitation, role_slug=form.role_slug)
```

The API method returns a `ProjectInvitation` and the router has the information to serialize it with `response_model=ProjectInvitationSerializer`.

In the second case, we'll have:
```python
PROJECT_DETAIL_200 = responses.http_status_200(model=ProjectDetailSerializer)
@routes.projects.get(
     "/{id}",
     name="project.get",
     summary="Get project",
     responses=PROJECT_DETAIL_200 | ERROR_404 | ERROR_422 | ERROR_403,
 )
 async def get_project(
     request: AuthRequest, id: B64UUID = Query("", description="the project id (B64UUID)")
 ) -> ProjectDetailSerializer:
     """
     Get project detail by id.
     """

     project = await get_project_or_404(id)
     await check_permissions(permissions=GET_PROJECT, user=request.user, obj=project)
     return await projects_services.get_project_detail(project=project, user=request.user)
```

The API method returns the `ProjectDetailSerializer` and we create a new `response` type with the serializer in the router. The new response `PROJECT_DETAIL_200` is used by OpenAPI and Swagger to generate automatic documentation.


## Further information

`response_model` in the router is used to serialize and generate the automatic documentation. If we return a serializer object from the service and then, the `response_model` serializes it again:
- the serialization is done twice, which could have performance issues
- in some cases the serialization fails, for instance, converting the ID into its B64 version (the second serialization fails).

The second scenario prevents the double serialization.
