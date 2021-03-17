/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
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
