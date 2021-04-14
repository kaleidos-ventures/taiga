import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';

import * as fromCore from './core.reducer';
import { ShortcutsService } from './services/shortcuts/shortcuts.services';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(fromCore.coreFeatureKey, fromCore.reducer),
  ],
  providers: [
    ShortcutsService
  ]
})
export class CoreModule {}
