import { RenderableInput } from "./inputs";


class RenderQueue {
    private _queue: RenderableInput[] = [];

    public add_items(items: RenderableInput[]): void {
        this._queue.push(...items);
    }
    
    public get_items(): RenderableInput[] {
        const queue = this._queue;
        this._queue = [];

        return queue;
    }


    public empty(): boolean {
        return this._queue.length === 0;
    }
}

export default RenderQueue;