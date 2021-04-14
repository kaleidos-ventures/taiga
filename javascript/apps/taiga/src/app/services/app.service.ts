import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { unexpectedError } from '@taiga/core';
import { UnexpectedError } from '@taiga/data';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  public formatHttpErrorResponse(error: HttpErrorResponse): UnexpectedError {
    return {
      message: error.message,
    };
  }
  public unexpectedHttpErrorResponseAction(error: HttpErrorResponse) {
    return unexpectedError({
      error: this.formatHttpErrorResponse(error),
    });
  }
}
