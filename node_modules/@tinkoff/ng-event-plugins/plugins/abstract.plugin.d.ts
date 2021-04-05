import { EventManager } from '@angular/platform-browser';
declare type EventManagerArg = ConstructorParameters<typeof EventManager>[0][0];
declare type EventManagerPlugin = {
    [K in keyof EventManagerArg]: EventManagerArg[K];
};
export declare abstract class AbstractEventPlugin implements EventManagerPlugin {
    protected abstract readonly modifier: string;
    manager: EventManager;
    supports(event: string): boolean;
    addGlobalEventListener(_element: string, _event: string, _handler: Function): Function;
    abstract addEventListener(element: HTMLElement, event: string, handler: Function): Function;
    protected unwrap(event: string): string;
}
export {};
