import { Frame } from '../emotes';
import { RenderableInput, RenderableImageInput, RenderableAnimatedImageInput, RenderableEmoteInput, RenderableAnimatedEmoteInput } from './inputs';


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

interface RenderContext {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    audio: HTMLAudioElement;
    display: HTMLDivElement;
}

abstract class Renderable {
    lifetime: number;
    sequential: boolean = true;
    position_x: number;
    position_y: number;

    constructor (opts: RenderableOptions) {
        this.lifetime = opts.lifetime;
        this.position_x = opts.position_x;
        this.position_y = opts.position_y;
    }
    
    abstract render (context: RenderContext): void;
    static from_renderable_input (input: RenderableInput, context: RenderContext): Renderable {
        throw new Error('Not implemented');
    }
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

    render (context: RenderContext): void {
        // TODO: Figure this part out
        // const opacity = 1 - (Date.now() - this.rendered_at) / this.lifetime;
        // context.context.globalAlpha = opacity;

        context.context.drawImage(
            this.image,
            this.position_x,
            this.position_y,
        );
    }

    static from_renderable_input (input: RenderableImageInput, _: RenderContext): Renderable {
        const renderable = input as RenderableImageInput;

        return new RenderableImage({
            image: renderable.image,
            lifetime: renderable.lifetime,
            position_x: renderable.position_x,
            position_y: renderable.position_y,
        });
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

    render (context: RenderContext): void {
        const now = Date.now();
        const last_rendered = this.last_rendered_at;
        const frame = this.frames[this.last_frame];
        const in_memory_canvas = document.createElement('canvas');
        const in_memory_context = in_memory_canvas.getContext('2d');
        // const opacity = 1 - (Date.now() - this.rendered_at) / this.lifetime;

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
        
        // context.context.globalAlpha = opacity;
        context.context.drawImage(
            in_memory_canvas,
            this.position_x,
            this.position_y,
        );
    }

    static from_renderable_input (input: RenderableAnimatedImageInput, _: RenderContext): Renderable {
        const renderable = input as RenderableAnimatedImageInput;

        return new RenderableAnimatedImage({
            frames: renderable.frames,
            last_frame: 0,
            last_rendered_at: Date.now(),
            lifetime: renderable.lifetime,
            position_x: renderable.position_x,
            position_y: renderable.position_y,
        });
    }
}

class RenderableEmote extends RenderableImage {
    direction_x: number;
    direction_y: number;
    velocity: number;
    sequential: boolean = false;

    constructor (opts: RenderableEmoteOpts) {
        super(opts);

        this.direction_x = opts.direction_x;
        this.direction_y = opts.direction_y;
        this.velocity = opts.velocity;
    }

    render (context: RenderContext): void {
        // const opacity = 1 - (Date.now() - this.rendered_at) / this.lifetime;
        const width = this.image.width;
        const height = this.image.height;

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
        // context.context.globalAlpha = opacity;
        super.render(context);
    }

    static from_renderable_input (input: RenderableEmoteInput, context: RenderContext): Renderable {
        const renderable = input as RenderableEmoteInput;

        return new RenderableEmote({
            image: renderable.image,
            lifetime: renderable.lifetime,
            position_x: Math.random() * context.canvas.width,
            position_y: Math.random() * context.canvas.height,

            // direction and velocity
            direction_x: Math.random() > 0.5 ? 1 : -1,
            direction_y: Math.random() > 0.5 ? 1 : -1,
            velocity: Math.random() * 5,
        });
    }
}

class AnimatedRenderableEmote extends RenderableAnimatedImage {
    direction_x: number;
    direction_y: number;
    velocity: number;
    sequential: boolean = false;

    constructor (opts: RenderableAnimatedEmoteOpts) {
        super(opts);

        this.frames = opts.frames;
        this.last_frame = opts.last_frame;
        this.last_rendered_at = opts.last_rendered_at;

        this.direction_x = opts.direction_x;
        this.direction_y = opts.direction_y;
        this.velocity = opts.velocity;
    }

    render (context: RenderContext): void {
        // const opacity = 1 - (Date.now() - this.rendered_at) / this.lifetime;
        const width = this.frames[this.last_frame].frame_width;
        const height = this.frames[this.last_frame].frame_height;

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
        // context.context.globalAlpha = opacity;
        super.render(context);
    }

    static from_renderable_input (input: RenderableAnimatedEmoteInput, context: RenderContext): Renderable {
        const renderable = input as RenderableAnimatedEmoteInput;

        return new AnimatedRenderableEmote({
            frames: renderable.frames,
            last_frame: 0,
            last_rendered_at: Date.now(),
            lifetime: renderable.lifetime,
            position_x: Math.random() * context.canvas.width,
            position_y: Math.random() * context.canvas.height,

            // direction and velocity
            direction_x: Math.random() > 0.5 ? 1 : -1,
            direction_y: Math.random() > 0.5 ? 1 : -1,
            velocity: Math.random() * 5,
        });
    }
}

export {
    RenderableOptions,
    RenderableImageOptions,
    RenderableAnimatedImageOptions,
    RenderableEmoteOpts,
    RenderableAnimatedEmoteOpts,
    RenderServiceOptions,
    Renderable,
    RenderableImage,
    RenderableAnimatedImage,
    RenderableEmote,
    AnimatedRenderableEmote,
    RepositionOptions,
    RepositionLogic,
    RenderContext,
}