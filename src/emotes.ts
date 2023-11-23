import { parseGIF, decompressFrames } from 'gifuct-js'


interface BaseEmote {
    animated: boolean;
}

interface RawEmote extends BaseEmote {
    image: HTMLImageElement
    animated: false;
}

interface Frame {
    data: Uint8ClampedArray;
    duration: number;
    frame_width: number;
    frame_height: number;
    top: number;
    left: number;
}

interface AnimatedEmote extends BaseEmote {
    animated: true;
    frames: Frame[];
}

class EmoteService {
    cache: Map<string, BaseEmote> = new Map();
    user_id: string;

    constructor(user_id: string) {
        this.user_id = user_id;
    }

    async _into_animated_emote (data: ArrayBuffer): Promise<AnimatedEmote> {
        const gif = parseGIF(data);
        const frames = decompressFrames(gif, true);
        const emote: AnimatedEmote = {
            animated: true,
            frames: frames.map((frame) => ({
                data: frame.patch,
                duration: frame.delay,
                frame_width: frame.dims.width,
                frame_height: frame.dims.height,
                top: frame.dims.top,
                left: frame.dims.left,
            })),
        };

        return emote;
    }

    async get_twitch_emote (emote_id: string): Promise<BaseEmote> {
        if (this.cache.has(emote_id)) {
            return this.cache.get(emote_id);
        }

        const result = await fetch(get_emote_url(emote_id));
        const content_type = result.headers.get('Content-Type');

        // if the image is missing, don't add it
        if (!result.ok) {
            return null;
        }

        console.log(`[emote] ${emote_id} ${content_type}`)

        let emote = null;

        // if the emote is a gif, we need to parse it
        if (content_type === 'image/gif') {
            emote = await this._into_animated_emote(await result.arrayBuffer());
            // const emote = await this._into_animated_emote(await result.arrayBuffer());
            // this.cache.set(emote_id, emote);
            // return emote;
        } else {
            const image = new Image();
            image.src = URL.createObjectURL(await result.blob());

            (emote as RawEmote) = {
                image: image,
                animated: false,
            };
        }
        
        console.log(emote)
        this.cache.set(emote_id, emote);
        return emote;
    }

    // async get_7tv_emote (emote_id: string): Promise<HTMLImageElement> {
    //     const image = new Image();

    //     if (this.cache.has(emote_id)) {
    //         image.src = this.cache.get(emote_id);
    //         return image;
    //     }

    //     const result = await fetch(get_7tv_emote_url(emote_id));

    //     // if the image is missing, don't add it
    //     if (!result.ok) {
    //         return null;
    //     }

    //     // convert image into a data url
    //     const data_url = URL.createObjectURL(await result.blob());

    //     this.cache.set(emote_id, data_url);
    //     image.src = data_url;

    //     return image;
    // }
}

function get_emote_url(emote_id: string, theme_mode?: string, scale?: string): string {
    const template = 'https://static-cdn.jtvnw.net/emoticons/v2/<id>/default/<theme_mode>/<scale>';

    return template
        .replace('<id>', emote_id)
        .replace('<theme_mode>', theme_mode || 'dark')
        .replace('<scale>', scale || '2.0');
}

export { EmoteService, BaseEmote, RawEmote, AnimatedEmote, Frame }
