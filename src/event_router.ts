import { RenderQueue } from "./renderable";


type EventCallback = (channel: string, tags: any, message: string, queue: RenderQueue) => Promise<void>;

// NOTE: This will be expanded out in the future
// to include more events
enum TwitchEvent {
    Chat,
}

class EventRouter {
    callbacks: Map<TwitchEvent, EventCallback[]> = new Map();
    render_queue: RenderQueue;

    constructor (render_queue: RenderQueue) {
        this.render_queue = render_queue;
    }

    register (event: TwitchEvent, callback: EventCallback): void {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }

        this
            .callbacks
            .get(event)
            .push(callback);
    }

    on_chat_event(channel: string, tags: any, message: string): void {
        this
            .callbacks
            .get(TwitchEvent.Chat)
            .forEach(callback => callback(channel, tags, message, this.render_queue));
    }
}

export {
    EventRouter,
    TwitchEvent,
    EventCallback,
}