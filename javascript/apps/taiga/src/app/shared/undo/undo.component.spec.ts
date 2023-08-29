/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Spectator, createHostFactory } from '@ngneat/spectator/jest';
import { UndoComponent } from './undo.component';
import { Subject } from 'rxjs';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { fakeAsync } from '@angular/core/testing';

describe('TooltipDirective', () => {
  let spectator: Spectator<UndoComponent>;
  const createHost = createHostFactory({
    component: UndoComponent,
    imports: [getTranslocoModule()],
  });
  const init$ = new Subject<void>();

  it('run undo & wait confirm', fakeAsync(() => {
    const confirm = jest.fn();

    spectator = createHost(
      `
    <tg-undo [initUndo]="initUndo$" (confirm)="confirm()">
      <div class="content">Some content here</div>
    </tg-undo>`,
      {
        hostProps: {
          initUndo$: init$.asObservable(),
          confirm,
        },
      }
    );

    init$.next();

    spectator.detectChanges();

    expect(spectator.query('[data-test="undo-action"]')).toExist();

    expect(confirm).not.toHaveBeenCalled();

    spectator.tick(6000);

    expect(confirm).toHaveBeenCalled();
  }));

  it('run undo & close', fakeAsync(() => {
    const confirm = jest.fn();

    spectator = createHost(
      `
    <tg-undo [initUndo]="initUndo$" (confirm)="confirm()">
      <div class="content">Some content here</div>
    </tg-undo>`,
      {
        hostProps: {
          initUndo$: init$.asObservable(),
          confirm,
        },
      }
    );

    init$.next();

    spectator.detectChanges();

    expect(spectator.query('[data-test="undo-action"]')).toExist();

    spectator.click('[data-test="close-action"]');

    expect(confirm).toHaveBeenCalled();
  }));

  it('run undo & cancel', fakeAsync(() => {
    const confirm = jest.fn();

    spectator = createHost(
      `
    <tg-undo [initUndo]="initUndo$" (confirm)="confirm()">
      <div class="content">Some content here</div>
    </tg-undo>`,
      {
        hostProps: {
          initUndo$: init$.asObservable(),
          confirm,
        },
      }
    );

    init$.next();

    spectator.detectChanges();

    expect(spectator.query('[data-test="undo-action"]')).toExist();

    spectator.click('[data-test="undo-action"]');

    spectator.tick(6000);

    expect(confirm).not.toHaveBeenCalled();
  }));
});
