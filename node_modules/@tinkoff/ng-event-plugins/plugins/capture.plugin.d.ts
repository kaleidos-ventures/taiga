import { AbstractEventPlugin } from './abstract.plugin';
export declare class CaptureEventPlugin extends AbstractEventPlugin {
    protected readonly modifier = "capture";
    supports(event: string): boolean;
    addEventListener(element: HTMLElement, event: string, handler: EventListener): Function;
}
