import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';

import { ModalComponent } from './components/modal.component';

@NgModule({
  imports: [CommonModule, OverlayModule],
  declarations: [ModalComponent],
  exports: [
    ModalComponent
  ]
})
export class ModalModule {

}
