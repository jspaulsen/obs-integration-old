import { EmoteService, Frame, RawEmote, AnimatedEmote } from './emotes';


interface ChatEmote {
    id: string
}

interface RenderableOptions {
    lifetime: number;
    position_x: number;
    position_y: number;
}

interface RenderableImageOptions extends RenderableOptions {
    image: HTMLImageElement;
}

interface RenderableAnimatedImageOptions extends RenderableOptions {
    frames: Frame[];
    last_frame: number;
    last_rendered_at: number;
}

interface EmoteOps {
    direction_x: number;
    direction_y: number;

    velocity: number;
}

interface RenderableEmoteOpts extends RenderableImageOptions, EmoteOps { }
interface RenderableAnimatedEmoteOpts extends RenderableAnimatedImageOptions, EmoteOps { }

interface RenderServiceOptions {
    canvas: HTMLCanvasElement;
    emote_lifetime_secs?: number;
    user_id: string;
}

interface PositionDirection {
    x: number;
    y: number;
    direction_x: number;
    direction_y: number;
}

interface RepositionOptions {
    width: number;
    height: number;

    renderable: RenderableEmote | AnimatedRenderableEmote;
    canvas: HTMLCanvasElement;
}

abstract class Renderable {
    created_at: number;
    lifetime: number;
    position_x: number;
    position_y: number;

    constructor (opts: RenderableOptions) {
        this.created_at = Date.now();
        this.lifetime = opts.lifetime;
        this.position_x = opts.position_x;
        this.position_y = opts.position_y;
    }

    has_outlived_lifetime (now: number): boolean {
        return now - this.created_at > this.lifetime;
    }

    abstract render (canvas: CanvasRenderingContext2D): void;
}

class RepositionLogic {
    static reposition (opts: RepositionOptions): PositionDirection {
        const width = opts.width;
        const height = opts.height;
        
        // move the emote
        let x = opts.renderable.position_x + opts.renderable.velocity * opts.renderable.direction_x;
        let y = opts.renderable.position_y + opts.renderable.velocity * opts.renderable.direction_y;

        // bounce the emote off the walls
        if (x + width > opts.canvas.width) {
            opts.renderable.direction_x = -1;
        }

        if (x < 0) {
            opts.renderable.direction_x = 1;
        }

        if (y + height > opts.canvas.height) {
            opts.renderable.direction_y = -1;
        }

        if (y < 0) {
            opts.renderable.direction_y = 1;
        }

        return {
            x,
            y,
            direction_x: opts.renderable.direction_x,
            direction_y: opts.renderable.direction_y,
        };
    }
}

class RenderableImage extends Renderable {
    image: HTMLImageElement;

    constructor (opts: RenderableImageOptions) {
        super(opts);

        this.image = opts.image;
    }

    render (context: CanvasRenderingContext2D): void {
        const opacity = 1 - (Date.now() - this.created_at) / this.lifetime;

        context.globalAlpha = opacity;
        context.drawImage(
            this.image,
            this.position_x,
            this.position_y,
        );

        console.log(`main render: ${this.position_x}, ${this.position_y}`)
    }
}

class RenderableAnimatedImage extends Renderable {
    frames: Frame[];
    last_frame: number;
    last_rendered_at: number;

    constructor (opts: RenderableAnimatedImageOptions) {
        super(opts);

        this.frames = opts.frames;
        this.last_frame = opts.last_frame;
        this.last_rendered_at = opts.last_rendered_at;
    }

    render (context: CanvasRenderingContext2D): void {
        const now = Date.now();
        const last_rendered = this.last_rendered_at;
        const frame = this.frames[this.last_frame];
        const in_memory_canvas = document.createElement('canvas');
        const in_memory_context = in_memory_canvas.getContext('2d');
        const opacity = 1 - (Date.now() - this.created_at) / this.lifetime;

        // if the frame has expired, move to the next frame
        if (now - last_rendered > frame.duration) {
            if (this.last_frame === this.frames.length - 1) {
                this.last_frame = 0;
            } else {
                this.last_frame++;
            }

            this.last_rendered_at = now;
        }

        in_memory_canvas.width = frame.frame_width;
        in_memory_canvas.height = frame.frame_height;

        const frame_image_data = in_memory_context.createImageData(
            frame.frame_width,
            frame.frame_height,
        );

        frame_image_data.data.set(frame.data);
        
        in_memory_context.putImageData(
            frame_image_data,
            0,
            0,
        );
        
        context.globalAlpha = opacity;
        context.drawImage(
            in_memory_canvas,
            this.position_x,
            this.position_y,
        );
    }
}


class RenderableEmote extends RenderableImage implements RenderableEmoteOpts {
    direction_x: number;
    direction_y: number;
    velocity: number;

    constructor (opts: RenderableEmoteOpts) {
        super(opts);

        this.direction_x = opts.direction_x;
        this.direction_y = opts.direction_y;
        this.velocity = opts.velocity;
    }

    render (context: CanvasRenderingContext2D): void {
        const opacity = 1 - (Date.now() - this.created_at) / this.lifetime;
        const width = this.image.width;
        const height = this.image.height;

        if (this.has_outlived_lifetime(Date.now())) {
            return;
        }

        // move the emote
        const position = RepositionLogic.reposition({
            width,
            height,
            renderable: this,
            canvas: context.canvas,
        });

        this.position_x = position.x;
        this.position_y = position.y;
        this.direction_x = position.direction_x;
        this.direction_y = position.direction_y;

        // set image opacity
        context.globalAlpha = opacity;
        super.render(context);
    }
}

class AnimatedRenderableEmote extends RenderableAnimatedImage {
    direction_x: number;
    direction_y: number;
    velocity: number;

    constructor (opts: RenderableAnimatedEmoteOpts) {
        super(opts);

        this.frames = opts.frames;
        this.last_frame = opts.last_frame;
        this.last_rendered_at = opts.last_rendered_at;

        this.direction_x = opts.direction_x;
        this.direction_y = opts.direction_y;
        this.velocity = opts.velocity;
    }

    render (context: CanvasRenderingContext2D): void {
        const opacity = 1 - (Date.now() - this.created_at) / this.lifetime;
        const width = this.frames[this.last_frame].frame_width;
        const height = this.frames[this.last_frame].frame_height;

        if (this.has_outlived_lifetime(Date.now())) {
            return;
        }

        // move the emote
        const position = RepositionLogic.reposition({
            width,
            height,
            renderable: this,
            canvas: context.canvas,
        });

        this.position_x = position.x;
        this.position_y = position.y;
        this.direction_x = position.direction_x;
        this.direction_y = position.direction_y;

        // set image opacity
        context.globalAlpha = opacity;
        super.render(context);
    }
}

class RenderService {
    canvas: HTMLCanvasElement;
    in_memory_canvas: HTMLCanvasElement;
    in_memory_context: CanvasRenderingContext2D;
    context: CanvasRenderingContext2D;
    emote_lifetime_secs: number = 1000;
    emote_service: EmoteService;

    queue: Renderable[] = [];

    constructor (opts: RenderServiceOptions) {
        this.canvas = opts.canvas
        this.in_memory_canvas = document.createElement('canvas');
        this.in_memory_context = this.in_memory_canvas.getContext('2d');
        this.context = this.canvas.getContext('2d');
        this.emote_lifetime_secs = (opts.emote_lifetime_secs || this.emote_lifetime_secs) * 1000;
        this.emote_service = new EmoteService(opts.user_id);
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

        this.queue.push(new_emote);
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

        this.clear_canvas();

        for (const renderable of this.queue) {
            console.log(renderable);
            if (renderable.has_outlived_lifetime(now)) {
                this.queue.splice(this.queue.indexOf(renderable), 1);
                continue;
            }

            renderable.render(this.context);
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