/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Signal,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  distinctUntilChanged,
  interval,
  map,
  startWith,
  switchMap,
} from 'rxjs';
import { DateService } from '~/app/services/date.service';
import { filterFalsy } from '../utils/operators';

@Component({
  standalone: true,
  selector: 'tg-real-time-date-distance',
  template: '{{ realDate() }}',
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealTimeDateDistanceComponent {
  @Input({ required: true }) public set date(date: string) {
    this.date$.next(date);
  }

  public realDate!: Signal<string>;

  private dateService = inject(DateService);
  private date$ = new BehaviorSubject('');
  private checkTime = 1000 * 61;

  constructor() {
    const realDate$ = this.date$.pipe(
      filterFalsy(),
      distinctUntilChanged(),
      switchMap((date) => {
        return interval(this.checkTime).pipe(
          switchMap(() => this.date$),
          startWith(date)
        );
      }),
      map((date) => {
        return this.dateService.transformDateDistance(date);
      })
    );

    this.realDate = toSignal(realDate$, { initialValue: '' });
  }
}
