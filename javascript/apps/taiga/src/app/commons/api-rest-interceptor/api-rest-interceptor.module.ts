import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiRestInterceptorService } from './api-rest-interceptor.service';

@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ApiRestInterceptorService, multi: true },
  ],
  declarations: [],
  imports: [],
})
export class ApiRestInterceptorModule { }
