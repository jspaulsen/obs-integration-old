import { Frame } from '../emotes';


interface LifetimeOptions {
    lifetime: number;
}

interface PositionableOptions {
    position_x: number;
    position_y: number;
}

interface ImageOptions {
    image: HTMLImageElement;
}

interface AnimatedOptions {
    frames: Frame[];
}

interface StaticRenderableOptions extends LifetimeOptions, PositionableOptions {
    lifetime: number;
    position_x: number;
    position_y: number;
}

interface RenderableImageOptions extends StaticRenderableOptions, ImageOptions {}
interface RenderableEmoteOptions extends LifetimeOptions, ImageOptions {}

interface RenderableAnimatedImageOptions extends StaticRenderableOptions, AnimatedOptions {}
interface RenderableAnimatedEmoteOptions extends LifetimeOptions, AnimatedOptions {}


abstract class RenderableInput {
    lifetime: number;

    constructor (opts: LifetimeOptions) {
        this.lifetime = opts.lifetime;
    }
}

class RenderableImageInput extends RenderableInput {
    image: HTMLImageElement;
    position_x: number;
    position_y: number;
    lifetime: number;

    constructor (opts: RenderableImageOptions) {
        super(opts);

        this.image = opts.image;
        this.position_x = opts.position_x;
        this.position_y = opts.position_y;
        this.lifetime = opts.lifetime;
    }
}

class RenderableEmoteInput extends RenderableInput {
    image: HTMLImageElement;
    lifetime: number;

    constructor (opts: RenderableEmoteOptions) {
        super(opts);

        this.image = opts.image;
        this.lifetime = opts.lifetime;
    }
}

class RenderableAnimatedImageInput extends RenderableInput {
    frames: Frame[];

    position_x: number;
    position_y: number;

    constructor (opts: RenderableAnimatedImageOptions) {
        super(opts);

        this.frames = opts.frames;
        this.position_x = opts.position_x;
        this.position_y = opts.position_y;
    }
}

class RenderableAnimatedEmoteInput extends RenderableInput {
    frames: Frame[];

    constructor (opts: RenderableAnimatedEmoteOptions) {
        super(opts);

        this.frames = opts.frames;
    }
}


export {
    RenderableInput,
    RenderableImageInput,
    RenderableEmoteInput,
    RenderableAnimatedImageInput,
    RenderableAnimatedEmoteInput,
}