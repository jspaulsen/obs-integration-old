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

interface AnimatedRawEmote extends BaseEmote {
    animated: true;
    frames: Frame[];
}

class EmoteService {
    cache: Map<string, BaseEmote> = new Map();
    user_id: string;

    constructor(user_id: string) {
        this.user_id = user_id;
    }

    async _into_animated_emote (data: ArrayBuffer): Promise<AnimatedRawEmote> {
        const gif = parseGIF(data);
        const frames = decompressFrames(gif, true);
        const emote: AnimatedRawEmote = {
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

    async get_twitch_emote (emote_id: string): Promise<BaseEmote | null> {
        if (this.cache.has(emote_id)) {
            return this.cache.get(emote_id);
        }

        const result = await fetch(get_emote_url(emote_id));
        const content_type = result.headers.get('Content-Type');

        // if the image is missing, don't add it
        if (!result.ok) {
            return null;
        }

        let emote = null;

        // if the emote is a gif, we need to parse it
        if (content_type === 'image/gif') {
            emote = await this._into_animated_emote(await result.arrayBuffer());
        } else {
            const image = new Image();
            image.src = URL.createObjectURL(await result.blob());

            (emote as RawEmote) = {
                image: image,
                animated: false,
            };
        }
        
        this.cache.set(emote_id, emote);
        return emote;
    }
}

function get_emote_url(emote_id: string, theme_mode?: string, scale?: string): string {
    const template = 'https://static-cdn.jtvnw.net/emoticons/v2/<id>/default/<theme_mode>/<scale>';

    return template
        .replace('<id>', emote_id)
        .replace('<theme_mode>', theme_mode || 'dark')
        .replace('<scale>', scale || '2.0');
}

export { EmoteService, BaseEmote, RawEmote, AnimatedRawEmote, Frame }
