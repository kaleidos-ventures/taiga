## Example action

```ts
export const login = createAction(
  '[Auth] login',
  props<{ username: User['username']; password: string }>()
);
```

## Actions naming

This example is using a fake user list.

`fetchUsers` - api call to retrieve all users.
`fetchUsersSuccess` - could store the users in the global state.
`fetchUsersError`

`setUsers` - manually set the user list in the global state.

`createUser` - api call to create an user. In an optimistic update the user can be stored in the global state.
`createUserSuccess` - in a pessimistic update the user can be stored in the global state.
`createUserError` - undo the added user in the global state by an optimistic update.

`addUser` - manually add an user to the global state user list.

`deleteUser` - api call to delete an user. In an optimistic update the user can be deleted in the global state.
`deleteUserSuccess` - in a pessimistic update the user can be deleted from the global state.
`deleteUserError` - undo the deleted user in the global state by an optimistic update.

`fetchUser` - retrieve an individual user from the api.

`updateUser` - api call to update the user. In an optimistic update the user can be stored in the global state.
`updateUserSuccess` - in a pessimistic update the user can be stored in the global state.
`updateUserError` - undo the updated user in the global state by an optimistic update.
