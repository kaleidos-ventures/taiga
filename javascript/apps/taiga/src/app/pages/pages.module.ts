import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [

];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabled'
    }),
  ],
  providers: [],
  exports: [
    RouterModule
  ]
})
export class PagesModule { }
