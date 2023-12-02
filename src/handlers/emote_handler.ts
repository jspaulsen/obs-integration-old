import { AnimatedRawEmote, EmoteService, RawEmote } from "../emotes";
import { RenderQueue, AnimatedEmoteRenderable, EmoteRenderable, ImageRenderable, Renderable } from "../renderable";


class EmoteHandler {
    emote_service: EmoteService;
    lifetime: number;

    constructor (user_id: string, lifetime_secs: number) {
        this.emote_service = new EmoteService(user_id);
        this.lifetime = lifetime_secs * 1000;
    }

    async _get_twitch_emote (emote_id: string): Promise<Renderable | null> {
        const emote = await this.emote_service.get_twitch_emote(emote_id);

        if (!emote) {
            return null;
        }

        if (emote.animated) {
            return new AnimatedEmoteRenderable({
                frames: (emote as AnimatedRawEmote).frames,
                lifetime: this.lifetime,
                position_x: null,
                position_y: null,
            });
        } else {
            return new EmoteRenderable({
                image: (emote as RawEmote).image,
                lifetime: this.lifetime,
                position_x: null,
                position_y: null,
            });
        }
    }

    async _get_7tv_emote (emote_id: string): Promise<Renderable | null> {
        const emote = await this.emote_service.get_7tv_emote(emote_id);

        if (!emote) {
            return null;
        }

        return new EmoteRenderable({
            image: emote.image,
            lifetime: this.lifetime,
            position_x: null,
            position_y: null,
        });
    }

    async on_handle_emote_event (channel: string, tags: any, message: string, queue: RenderQueue) {
        const emotes: Renderable[] = [];

        if (tags.emotes) {
            for (const emote_id in tags.emotes) {
                const emote = await this._get_twitch_emote(emote_id);
                const count = tags.emotes[emote_id].length;
                
                if (!emote) {
                    continue;
                }

                for (let i = 0; i < count; i++) {
                    emotes.push(emote);
                }
            }
        }

        const words = message.split(' ');

        for (const word of words) {
            const emote = await this._get_7tv_emote(word);

            if (emote) {
                emotes.push(emote);
            }
        }

        queue.add_items(emotes);
    }    
}


export {
    EmoteHandler,
}
