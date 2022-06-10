/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { ModalModule } from 'libs/ui/src/lib/modal/modal.module';
import { ProjectFeatureKanbanComponent } from './project-feature-kanban.component';

describe('KanbanPageComponent', () => {
  let component: ProjectFeatureKanbanComponent;
  let fixture: ComponentFixture<ProjectFeatureKanbanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreModule.forRoot({}), ModalModule],
      declarations: [ProjectFeatureKanbanComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectFeatureKanbanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
