/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { DomPortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';

@Injectable()
export class ModalService {
  private portal$ = new BehaviorSubject<DomPortal|null>(null);
  private overlayRef!: OverlayRef;

  constructor(private overlay: Overlay) {
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      panelClass: ['modal', 'is-active'],
      backdropClass: 'modal-bg'
    });
  }

  public open(domPortal: DomPortal) {
    this.close();

    if (domPortal) {
      this.overlayRef.attach(domPortal);
    }
  }

  public close(): void {
    this.overlayRef.detach();
  }

  public get portal() {
    return this.portal$.asObservable();
  }
}
