import { Renderable, RenderableImage, RenderableEmote, AnimatedRenderableEmote, RenderContext } from './types';
import { RenderableInput, RenderableImageInput, RenderableEmoteInput, RenderableAnimatedImageInput, RenderableAnimatedEmoteInput } from './inputs';
import RenderQueue from './queue';


function into_renderable(input: RenderableInput, context: RenderContext): Renderable {
    let RenderableClass: typeof Renderable = null;

    if (input instanceof RenderableImageInput) {
        RenderableClass = RenderableImage;
    } else if (input instanceof RenderableEmoteInput) {
        RenderableClass = RenderableEmote;
    } else if (input instanceof RenderableAnimatedImageInput) {
        RenderableClass = AnimatedRenderableEmote;
    } else if (input instanceof RenderableAnimatedEmoteInput) {
        RenderableClass = AnimatedRenderableEmote;
    }

    return RenderableClass.from_renderable_input(input, context);
}


interface RenderServiceOptions {
    canvas: HTMLCanvasElement;
    render_queue: RenderQueue;
    emote_lifetime_secs?: number;
    audio: HTMLAudioElement;
    display: HTMLDivElement;
}


class MortalRenderable {
    lifetime: number;
    start_time: number;
    renderable: Renderable;

    constructor (renderable: Renderable, lifetime: number) {
        this.lifetime = lifetime;
        this.renderable = renderable;
        this.start_time = Date.now();
    }

    has_outlived_lifetime (now: number): boolean {
        return now - this.start_time > this.lifetime;
    }
}

class RenderService {
    canvas: HTMLCanvasElement;
    in_memory_canvas: HTMLCanvasElement;
    in_memory_context: CanvasRenderingContext2D;
    context: CanvasRenderingContext2D;
    audio: HTMLAudioElement;
    display: HTMLDivElement;

    render_queue: MortalRenderable[] = [];
    queue: RenderQueue;

    constructor (opts: RenderServiceOptions) {
        this.canvas = opts.canvas
        this.in_memory_canvas = document.createElement('canvas');
        this.in_memory_context = this.in_memory_canvas.getContext('2d');
        this.context = this.canvas.getContext('2d');
        this.queue = opts.render_queue;
        this.audio = opts.audio;
        this.display = opts.display;
    }

    clear_canvas (): void {
        this.context.clearRect(
            0, 
            0, 
            this.canvas.width, 
            this.canvas.height,
        );
    }

    _render (): void {
        const now = Date.now();
        const context: RenderContext = {
            canvas: this.canvas,
            context: this.context,
            audio: this.audio,
            display: this.display,
        }

        const new_renderables: MortalRenderable[] = this
            .queue
            .get_items()
            .map((input) => {
                return new MortalRenderable(
                    into_renderable(input, context),
                    input.lifetime,
                );
            })

        this.render_queue.push(...new_renderables);
        this.clear_canvas();

        // TODO: Iterate through the list if renderables; if the renderable requires a specific item (i.e., audio),
        // check if it's loaded. If it's not, don't render it.
        // Actually, we should probably just have a flag to indicate whether visual/audio is currently loaded
        const nqueue: MortalRenderable[] = [];
        let sequential_renderable_loaded = false;

        while (this.render_queue.length > 0) {
            const renderable = this.render_queue.shift();

            if (renderable.has_outlived_lifetime(now)) {
                continue;
            }
            
            // If we're already rendering a singular renderable, don't render any more singular renderables
            if (renderable.renderable.sequential && sequential_renderable_loaded) {
                nqueue.push(renderable);
                continue;
            }

            // If we're rendering a singular renderable, set the flag
            if (renderable.renderable.sequential) {
                sequential_renderable_loaded = true;
            }
            
            renderable.renderable.render(context);
            nqueue.push(renderable);
        }

        this.render_queue = nqueue;
    }

    render (): void {
        this._render();

        requestAnimationFrame(
            this
                .render
                .bind(this)
        );
    }
}


export { RenderService };