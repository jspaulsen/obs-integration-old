import { EmoteService, RawEmote, AnimatedEmote } from '../emotes';
import { Renderable, RenderableImage, RenderableEmote, AnimatedRenderableEmote, RenderContext } from './types';
import { RenderableInput, RenderableImageInput, RenderableEmoteInput, RenderableAnimatedImageInput, RenderableAnimatedEmoteInput } from './inputs';
import RenderQueue from './render_queue';


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
    user_id: string;
    audio: HTMLAudioElement;
    display: HTMLDivElement;
}

class RenderService {
    canvas: HTMLCanvasElement;
    in_memory_canvas: HTMLCanvasElement;
    in_memory_context: CanvasRenderingContext2D;
    context: CanvasRenderingContext2D;
    emote_lifetime_secs: number = 1000;
    emote_service: EmoteService;
    audio: HTMLAudioElement;
    display: HTMLDivElement;

    render_queue: Renderable[] = [];
    _queue: RenderQueue;

    constructor (opts: RenderServiceOptions) {
        this.canvas = opts.canvas
        this.in_memory_canvas = document.createElement('canvas');
        this.in_memory_context = this.in_memory_canvas.getContext('2d');
        this.context = this.canvas.getContext('2d');
        this.emote_lifetime_secs = (opts.emote_lifetime_secs || this.emote_lifetime_secs) * 1000;
        this.emote_service = new EmoteService(opts.user_id);
        this._queue = opts.render_queue;
        this.audio = opts.audio;
        this.display = opts.display;
    }

    async add_emote (chat_emote: ChatEmote): Promise<void> {
        const raw_emote = await this
            .emote_service
            .get_twitch_emote(chat_emote.id);
    
        //if the image is missing, don't add it
        if (!raw_emote) {
            return;
        }

        let new_emote = null;
        let base_emote = {
            created_at: Date.now(),
            position_x: Math.random() * this.canvas.width,
            position_y: Math.random() * this.canvas.height,

            // direction and velocity
            direction_x: Math.random() > 0.5 ? 1 : -1,
            direction_y: Math.random() > 0.5 ? 1 : -1,

            velocity: 3,
            lifetime: this.emote_lifetime_secs,
        };

        //if the image is missing, don't add it
        if (!raw_emote) {
            return;
        }

        // if the image is animated, add it as an animated emote
        if (raw_emote.animated) {
            let animated_emote = new AnimatedRenderableEmote({
                ...base_emote,
                frames: (raw_emote as AnimatedEmote).frames,
                last_frame: 0,
                last_rendered_at: Date.now(),
            });

            new_emote = animated_emote;
        } else {
            let static_emote = new RenderableEmote({
                ...base_emote,
                image: (raw_emote as RawEmote).image,
            });

            new_emote = static_emote;
        }

        this.render_queue.push(new_emote);
    }

    async add_emotes (emotes: ChatEmote[]): Promise<void> {
        for (const emote of emotes) {
            await this.add_emote(emote);
        }
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
            display: document.getElementById('display') as HTMLDivElement, // TODO: fix this
        }

        const new_renderables = this
            ._queue
            .get_items()
            .map((input) => into_renderable(input, context));

        this.render_queue.push(...new_renderables);
        this.clear_canvas();

        // TODO: Iterate through the list if renderables; if the renderable requires a specific item (i.e., audio),
        // check if it's loaded. If it's not, don't render it. 
    
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