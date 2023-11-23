import { EmoteService, Frame, RawEmote, AnimatedEmote } from './emotes';


interface ChatEmote {
    id: string
}

interface BaseEmote {
    created_at: number;
    position_x: number;
    position_y: number;

    // direction and velocity
    direction_x: number;
    direction_y: number;
    velocity_x: number;
    velocity_y: number;

    animated: boolean;
}


interface RenderableEmote extends BaseEmote {
    animated: false;
    image: HTMLImageElement;
}

interface AnimatedRenderableEmote extends BaseEmote {
    animated: true;
    frames: Frame[];
    last_frame: number; 
    last_rendered_at: number;
}

interface RenderServiceOptions {
    canvas: HTMLCanvasElement;
    emote_lifetime_secs?: number;
    user_id: string;
}


function has_outlived_lifetime(emote: BaseEmote, lifetime: number): boolean {
    return Date.now() - emote.created_at > lifetime;
}

class RenderService {
    emotes: BaseEmote[] = [];
    canvas: HTMLCanvasElement;
    in_memory_canvas: HTMLCanvasElement;
    in_memory_context: CanvasRenderingContext2D;
    context: CanvasRenderingContext2D;
    emote_lifetime_secs: number = 1000;
    emote_service: EmoteService;

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
        
        let emote: BaseEmote = {
            animated: false,
            created_at: Date.now(),
            position_x: Math.random() * this.canvas.width,
            position_y: Math.random() * this.canvas.height,

            // direction and velocity
            direction_x: Math.random() > 0.5 ? 1 : -1,
            direction_y: Math.random() > 0.5 ? 1 : -1,

            velocity_x: 3,
            velocity_y: 3,
        };

        //if the image is missing, don't add it
        if (!emote) {
            return;
        }

        // if the image is animated, add it as an animated emote
        if (raw_emote.animated) {
            let animated_emote: AnimatedRenderableEmote = {
                ...emote,
                animated: true,
                frames: null,
                last_frame: 0,
                last_rendered_at: Date.now(),
            }

            animated_emote.frames = (raw_emote as AnimatedEmote).frames;
            animated_emote.last_rendered_at = Date.now();
            
            emote = animated_emote;
        } else {
            let renderable_emote = raw_emote as RawEmote;
            let renderable: RenderableEmote = {
                ...emote,
                animated: false,
                image: (raw_emote as RawEmote).image,
            }

            emote = renderable;
        }

        this.emotes.push(emote);
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

    _render_animated_emote (emote: AnimatedRenderableEmote): void {
        const now = Date.now();
        const last_rendered = emote.last_rendered_at;
        const frame = emote.frames[emote.last_frame];

        // if the frame has expired, move to the next frame
        if (now - last_rendered > frame.duration) {
            if (emote.last_frame === emote.frames.length - 1) {
                emote.last_frame = 0;
            } else {
                emote.last_frame++;
            }

            emote.last_rendered_at = now;
        }

        this.in_memory_canvas.width = frame.frame_width;
        this.in_memory_canvas.height = frame.frame_height;

        const frame_image_data = this.in_memory_context.createImageData(
            frame.frame_width,
            frame.frame_height,
        );

        frame_image_data.data.set(frame.data);
        
        this.in_memory_context.putImageData(
            frame_image_data,
            0,
            0,
        );

        this.context.drawImage(
            this.in_memory_canvas,
            emote.position_x,
            emote.position_y,
        );
    }


    _render (): void {
        this.clear_canvas();

        for (const emote of this.emotes) {
            let width: number = null;
            let height: number = null;

            if (has_outlived_lifetime(emote, this.emote_lifetime_secs)) {
                this.emotes.splice(this.emotes.indexOf(emote), 1);
                continue
            }

            // if the emote is animated, we need to render it differently
            if (emote.animated) {
                let render_emote = emote as AnimatedRenderableEmote;

                width = render_emote.frames[render_emote.last_frame].frame_width;
                height = render_emote.frames[render_emote.last_frame].frame_height;

                console.log(width, height)
            } else {
                let render_emote = emote as RenderableEmote;
                
                console.log(`Image is ${render_emote.image}`)
                width = render_emote.image.width;       
                height = render_emote.image.height;
            }

            // move the emote
            emote.position_x += emote.velocity_x * emote.direction_x;
            emote.position_y += emote.velocity_y * emote.direction_y;

            // bounce the emote off the walls
            if (emote.position_x + width > this.canvas.width) {
                emote.direction_x = -1;
            }

            if (emote.position_x < 0) {
                emote.direction_x = 1;
            }

            if (emote.position_y + height > this.canvas.height) {
                emote.direction_y = -1;
            }

            if (emote.position_y < 0) {
                emote.direction_y = 1;
            }

            // set image opacity
            const opacity = 1 - (Date.now() - emote.created_at) / this.emote_lifetime_secs;
            this.context.globalAlpha = opacity;
            
            // if the emote is animated, render it differently
            if (emote.animated) {
                this._render_animated_emote(emote as AnimatedRenderableEmote);
            } else {
                this.context.drawImage(
                    (emote as RenderableEmote).image,
                    emote.position_x,
                    emote.position_y,
                );
            }
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


export { RenderService as Renderer, RenderableEmote, ChatEmote };

// https://stackoverflow.com/questions/52438094/how-to-animate-an-image-in-canvas-using-requestanimationframe
// function loop(): void {
//     // this can be used for rendering; we probably 
//     // just need to move images at this frequecy
//     // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
//     // https://w3schools.com/jsref/met_win_requestanimationframe.asp
//     requestAnimationFrame(loop);
// }