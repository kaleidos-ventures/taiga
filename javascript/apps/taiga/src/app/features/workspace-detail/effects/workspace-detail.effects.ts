/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

// import { Injectable } from '@angular/core';
// import { Actions, createEffect, ofType } from '@ngrx/effects';

// import { concatMap } from 'rxjs/operators';
// import { Observable, EMPTY } from 'rxjs';

// import * as WorkspaceDetailActions from '../actions/workspace-detail.actions';


// @Injectable()
// export class WorkspaceDetailEffects {


//   loadWorkspaceDetails$ = createEffect(() => {
//     return this.actions$.pipe(

//       ofType(WorkspaceDetailActions.loadWorkspaceDetails),
//       /** An EMPTY observable only emits completion. Replace with your own observable API request */
//       concatMap(() => EMPTY as Observable<{ type: string }>)
//     );
//   });


//   constructor(private actions$: Actions) {}

// }
