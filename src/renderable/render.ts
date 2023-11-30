import { Frame } from "../emotes";
import RenderQueue from "./queue";


interface RenderContext {
    context: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    display: HTMLDivElement;
    audio: HTMLAudioElement;
    datetime: number;
}

interface RendererOptions {
    canvas: HTMLCanvasElement;
    audio: HTMLAudioElement;
    display: HTMLDivElement;
    queue: RenderQueue;
}

interface GraphicalOptions {
    lifetime: number;
    position_x: number;
    position_y: number;
}

interface RenderableImageOptions extends GraphicalOptions {
    image: HTMLImageElement;
}

interface RenderableAnimatedImageOptions extends GraphicalOptions {
    frames: Frame[];
}

interface RenderableAudioOptions {
    source: string;
}

interface RenderableEmoteOptions extends GraphicalOptions {
    image: HTMLImageElement;
}

abstract class Renderable {
    sequential: boolean = true;

    abstract render (context: RenderContext): void;
}

abstract class GraphicalRenderable extends Renderable {
    lifetime: number;
    position_x: number;
    position_y: number;

    constructor (opts: GraphicalOptions) {
        super();

        this.position_x = opts.position_x;
        this.position_y = opts.position_y;
        this.lifetime = opts.lifetime;
    }
}

abstract class PlayableRenderable extends Renderable {
    abstract is_complete (context: RenderContext): boolean;
}
    

class AudioRenderable extends PlayableRenderable {
    source: string;

    constructor (opts: RenderableAudioOptions) {
        super();

        this.source = opts.source;
    }

    render (context: RenderContext): void {
        // if it's already playing, don't play it again
        if (context.audio.src === this.source) {
            return;
        }
        
        context.audio.src = this.source;
        context.audio.play();
    }

    is_complete (context: RenderContext): boolean {
        console.log(`is_complete: ${context.audio.ended}`)
        return context.audio.ended;
    }
}

class ImageRenderable extends GraphicalRenderable {
    image: HTMLImageElement;

    constructor (opts: RenderableImageOptions) {
        super(opts);

        this.image = opts.image;
    }

    render (context: RenderContext): void {
        context.context.drawImage(
            this.image,
            this.position_x,
            this.position_y,
        );
    }
}

class AnimatedImageRenderable extends GraphicalRenderable {
    frames: Frame[];
    current_frame: number;
    last_frame_time: number | null = null;
    in_memory_canvas: HTMLCanvasElement;
    in_memory_context: CanvasRenderingContext2D;

    constructor (opts: RenderableAnimatedImageOptions) {
        super(opts);

        this.frames = opts.frames;
        this.current_frame = 0;
        this.in_memory_canvas = document.createElement('canvas');
        this.in_memory_context = this.in_memory_canvas.getContext('2d');
    }

    render (context: RenderContext): void {
        const frame = this.frames[this.current_frame];

        if (this.last_frame_time === null) {
            this.last_frame_time = context.datetime;
        }

        if (context.datetime - this.last_frame_time > frame.duration) {
            if (this.current_frame === this.frames.length - 1) {
                this.current_frame = 0;
            } else {
                this.current_frame++;
            }

            this.last_frame_time = context.datetime;
        }

        this.in_memory_canvas.width = frame.frame_width;
        this.in_memory_canvas.height = frame.frame_height;

        const frame_image_data = context.context.createImageData(
            frame.frame_width,
            frame.frame_height,
        );

        frame_image_data.data.set(frame.data);
        
        this.in_memory_context.putImageData(
            frame_image_data,
            0,
            0,
        );
        
        context.context.drawImage(
            this.in_memory_canvas,
            this.position_x,
            this.position_y,
        );
    }
}

class EmoteRenderable extends GraphicalRenderable {
    image: HTMLImageElement;
    direction_x: number = null;
    direction_y: number = null;
    velocity: number = null;
    width: number;
    height: number;
    sequential: boolean = false;

    constructor (opts: RenderableEmoteOptions) {
        super(opts);

        this.image = opts.image;
        this.width = this.image.width;
        this.height = this.image.height;
    }

    render (context: RenderContext): void {
        context.context.drawImage(
            this.image,
            this.position_x,
            this.position_y,
        );
    }
}

class AnimatedEmoteRenderable extends AnimatedImageRenderable {
    image: HTMLImageElement;
    direction_x: number = null;
    direction_y: number = null;
    velocity: number = null;
    width: number;
    height: number;
    sequential: boolean = false;

    constructor (opts: RenderableAnimatedImageOptions) {
        super(opts);

        this.width = opts.frames[0].frame_width;
        this.height = opts.frames[0].frame_height;
    }
}


class EphemeralRenderable {
    renderable: Renderable;
    rendered_at: number;

    constructor (renderable: Renderable, rendered_at: number) {
        this.renderable = renderable;
        this.rendered_at = rendered_at;
    }

    is_complete (context: RenderContext): boolean {
        if (this.renderable instanceof PlayableRenderable) {
            return this.renderable.is_complete(context);
        } else if (this.renderable instanceof GraphicalRenderable) {
            return this.renderable.lifetime + this.rendered_at < context.datetime;
        } else {
            return true;
        }
    }
}

class RepositionLogic {
    static reposition (emote: EmoteRenderable | AnimatedEmoteRenderable, context: RenderContext): EmoteRenderable | AnimatedEmoteRenderable {
        const width = emote.width
        const height = emote.height;

        if (emote.position_x === null || emote.position_y === null) {
            emote.position_x = Math.random() * context.canvas.width;
            emote.position_y = Math.random() * context.canvas.height;
        }

        if (emote.direction_x === null || emote.direction_y === null) {
            emote.direction_x = Math.random() * 3;
            emote.direction_y = Math.random() * 3;
        }

        if (emote.velocity === null) {
            emote.velocity = Math.random() * 3;
        }
        
        // move the emote
        let x = emote.position_x + emote.velocity * emote.direction_x;
        let y = emote.position_y + emote.velocity * emote.direction_y;

        // bounce the emote off the walls
        if (x + width > context.canvas.width) {
            emote.direction_x = -1;
        }

        if (x < 0) {
            emote.direction_x = 1;
        }

        if (y + height > context.canvas.height) {
            emote.direction_y = -1;
        }

        if (y < 0) {
            emote.direction_y = 1;
        }
        
        emote.position_x = x;
        emote.position_y = y;

        return emote;
    }
}


class RenderService {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    display: HTMLDivElement;
    audio: HTMLAudioElement;

    render_queue: RenderQueue;
    work_queue: EphemeralRenderable[] = [];
    sequential_slot: EphemeralRenderable | null = null;

    constructor (opts: RendererOptions) {
        this.canvas = opts.canvas;
        this.context = this.canvas.getContext('2d');
        this.display = opts.display;
        this.audio = opts.audio;
        this.render_queue = opts.queue;
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
            datetime: now,
        };

        const new_ephem = this
            .render_queue
            .get_items()
            .map((input) => { return new EphemeralRenderable(input, now); });

        this.work_queue.push(...new_ephem);

        this.clear_canvas();

        for (let ephem of this.work_queue) {
            if (ephem.is_complete(context)) {
                if (ephem.renderable.sequential) {
                    this.sequential_slot = null;
                }
                
                this.work_queue = this
                    .work_queue
                    .filter((e) => { return e !== ephem; });

                continue;
            }

            if (ephem.renderable instanceof EmoteRenderable || ephem.renderable instanceof AnimatedEmoteRenderable) {
                const opacity = (now - ephem.rendered_at) / ephem.renderable.lifetime;
                
                context.context.globalAlpha = 1 - opacity;
                ephem.renderable = RepositionLogic.reposition(ephem.renderable, context);
            }
            
            // if this is a sequential renderable and we already have one in the queue
            // then skip it, otherwise set it as the sequential renderable
            if (ephem.renderable.sequential && this.sequential_slot !== null) {
                console.log('skipping sequential renderable')
                continue;
            } else if (ephem.renderable.sequential) {
                this.sequential_slot = ephem;
                console.log('setting sequential renderable')
            }

            console.log('rendering')
            ephem.renderable.render(context);
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

export {
    RenderService,
    EmoteRenderable,
    AnimatedEmoteRenderable,
    ImageRenderable,
    AnimatedImageRenderable,
    AudioRenderable,
    GraphicalRenderable,
    Renderable,
}