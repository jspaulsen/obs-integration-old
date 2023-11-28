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


interface ChatEmote {
    id: string
}

interface RenderServiceOptions {
    canvas: HTMLCanvasElement;
    render_queue: RenderQueue;
    emote_lifetime_secs?: number;
    audio: HTMLAudioElement;
    display: HTMLDivElement;
}

class RenderService {
    canvas: HTMLCanvasElement;
    in_memory_canvas: HTMLCanvasElement;
    in_memory_context: CanvasRenderingContext2D;
    context: CanvasRenderingContext2D;
    audio: HTMLAudioElement;
    display: HTMLDivElement;

    render_queue: Renderable[] = [];
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

        const new_renderables = this
            .queue
            .get_items()
            .map((input) => into_renderable(input, context));

        this.render_queue.push(...new_renderables);
        this.clear_canvas();

        // TODO: Iterate through the list if renderables; if the renderable requires a specific item (i.e., audio),
        // check if it's loaded. If it's not, don't render it.
        // Actually, we should probably just have a flag to indicate whether visual/audio is currently loaded
    
        for (const renderable of this.render_queue) {
            if (renderable.has_outlived_lifetime(now)) {
                this.render_queue.splice(this.render_queue.indexOf(renderable), 1);
                continue;
            }
            
            renderable.render(context);
        }
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


export { RenderService, ChatEmote };