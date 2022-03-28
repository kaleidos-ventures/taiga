/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { initProjectOverview } from './data-access/+state/actions/project-overview.actions';
@Component({
  selector: 'tg-project-feature-overview',
  templateUrl: './project-feature-overview.component.html',
  styleUrls: ['./project-feature-overview.component.css'],
})
export class ProjectFeatureOverviewComponent
  implements OnInit, AfterViewChecked
{
  @ViewChild('descriptionOverflow')
  public descriptionOverflow?: ElementRef;

  public showDescription = false;
  public hideOverflow = false;

  constructor(private store: Store, private cd: ChangeDetectorRef) {}

  public project$ = this.store.select(selectCurrentProject);

  public ngOnInit() {
    this.showDescription = false;
    this.hideOverflow = false;

    this.store.dispatch(initProjectOverview());
  }

  public hasClamping(el: HTMLElement) {
    const { clientHeight, scrollHeight } = el;
    return clientHeight !== scrollHeight;
  }

  public toggleShowDescription() {
    this.hideOverflow = !this.hideOverflow;
  }

  public ngAfterViewChecked() {
    if (this.descriptionOverflow && !this.hideOverflow) {
      this.showDescription = this.hasClamping(
        this.descriptionOverflow.nativeElement as HTMLElement
      );
      this.cd.detectChanges();
    }
  }
}
