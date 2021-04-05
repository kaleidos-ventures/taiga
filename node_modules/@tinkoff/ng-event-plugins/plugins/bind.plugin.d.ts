import { Observable } from 'rxjs';
import { AbstractEventPlugin } from './abstract.plugin';
export declare class BindEventPlugin extends AbstractEventPlugin {
    protected readonly modifier = "$";
    addEventListener(element: HTMLElement & Record<string, Observable<unknown>>, event: string): Function;
    private getMethod;
}
