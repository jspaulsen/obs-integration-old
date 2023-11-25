import { RenderableInput } from "./inputs";


class RenderQueue {
    private _queue: RenderableInput[] = [];

    public add(renderable: RenderableInput): void {
        this._queue.push(renderable);
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