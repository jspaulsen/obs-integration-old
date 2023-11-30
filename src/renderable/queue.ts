import { Renderable } from "./render";

class RenderQueue {
    private _queue: Renderable[] = [];

    public add_items(items: Renderable[]): void {
        this._queue.push(...items);
    }
    
    public get_items(): Renderable[] {
        const queue = this._queue;
        this._queue = [];

        return queue;
    }

    public empty(): boolean {
        return this._queue.length === 0;
    }
}

export default RenderQueue;