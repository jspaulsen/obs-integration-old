import EmoteService from './emotes';


interface Emote {
    id: string
}

interface RenderableEmote {
    image: HTMLImageElement;
    created_at: number;
    position_x: number;
    position_y: number;

    // direction and velocity
    direction_x: number;
    direction_y: number;
    velocity_x: number;
    velocity_y: number;
}

interface RenderServiceOptions {
    canvas: HTMLCanvasElement;
    emote_lifetime_secs?: number
}


function has_outlived_lifetime(emote: RenderableEmote, lifetime: number): boolean {
    return Date.now() - emote.created_at > lifetime;
}

class RenderService {
    emotes: RenderableEmote[] = [];
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    emote_lifetime_secs: number = 1000;
    emote_service: EmoteService = new EmoteService();

    constructor (opts: RenderServiceOptions) {
        this.canvas = opts.canvas
        this.context = this.canvas.getContext('2d');
        this.emote_lifetime_secs = (opts.emote_lifetime_secs || this.emote_lifetime_secs) * 1000;
    }

    async add_emote (emote: Emote): Promise<void> {
        const image = await this.emote_service.get_emote(emote.id);

        //if the image is missing, don't add it
        if (!image) {
            return;
        }
        
        const renderable_emote: RenderableEmote = {
            image: image,
            created_at: Date.now(),
            position_x: Math.random() * this.canvas.width,
            position_y: Math.random() * this.canvas.height,

            // direction and velocity
            direction_x: Math.random() > 0.5 ? 1 : -1,
            direction_y: Math.random() > 0.5 ? 1 : -1,

            velocity_x: Math.random() * 4,
            velocity_y: Math.random() * 4,
        };

        this.emotes.push(renderable_emote);
    }

    async add_emotes (emotes: Emote[]): Promise<void> {
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
        this.clear_canvas();

        for (const emote of this.emotes) {
            if (has_outlived_lifetime(emote, this.emote_lifetime_secs)) {
                this.emotes.splice(this.emotes.indexOf(emote), 1);
                continue
            }

            // move the emote
            emote.position_x += emote.velocity_x * emote.direction_x;
            emote.position_y += emote.velocity_y * emote.direction_y;

            // bounce the emote off the walls
            if (emote.position_x + emote.image.width > this.canvas.width) {
                emote.direction_x = -1;
            }

            if (emote.position_x < 0) {
                emote.direction_x = 1;
            }

            if (emote.position_y + emote.image.height > this.canvas.height) {
                emote.direction_y = -1;
            }

            if (emote.position_y < 0) {
                emote.direction_y = 1;
            }

            // set image opacity
            const opacity = 1 - (Date.now() - emote.created_at) / this.emote_lifetime_secs;
            this.context.globalAlpha = opacity;

            // draw the emote
            this.context.drawImage(
                emote.image,
                emote.position_x,
                emote.position_y,
            );
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


export { RenderService as Renderer, RenderableEmote, Emote };

// https://stackoverflow.com/questions/52438094/how-to-animate-an-image-in-canvas-using-requestanimationframe
// function loop(): void {
//     // this can be used for rendering; we probably 
//     // just need to move images at this frequecy
//     // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
//     // https://w3schools.com/jsref/met_win_requestanimationframe.asp
//     requestAnimationFrame(loop);
// }