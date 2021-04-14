import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

type dataTypes = string | number | boolean | Date | File | undefined | null;

@Injectable({
  providedIn: 'root'
})
export class ApiUtilsService {
  public static buildQueryParams(
    source: Record<string, (dataTypes | dataTypes[])>,
    keyMap: Record<string, string> = {}) {
    let target: HttpParams = new HttpParams();

    Object.entries(source).forEach(([key, value]) => {
      const newKey = key in keyMap ? keyMap[key] : key;
      if (value === undefined) {
        target = target.append(newKey, 'undefined');
      } else if (value === null) {
        target = target.append(newKey, 'null');
      } else if (Array.isArray(value)) {
        target = target.append(newKey, value.join(','));
      } else if (typeof value === 'string') {
        target = target.append(newKey, value);
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        target = target.append(newKey, value.toString());
      }
    });

    return target;
  }

  public static buildFormData(
    source: Record<string, (dataTypes | dataTypes[])>,
    keyMap: Record<string, string> = {}) {
    const formData: FormData = new FormData();

    Object.entries(source).forEach(([key, value]) => {
      const newKey = key in keyMap ? keyMap[key] : key;

      if (value === undefined) {
        formData.append(newKey, 'undefined');
      } else if (value === null) {
        formData.append(newKey, 'null');
      } else if (value instanceof File) {
        formData.append(newKey, value, value.name);
      } else if (Array.isArray(value)) {
        formData.append(newKey, value.join(','));
      } else if (typeof value === 'string') {
        formData.append(newKey, value);
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        formData.append(newKey, value.toString());
      }
    });

    return formData;
  }
}
