import { AnimatedRawEmote, EmoteService, RawEmote } from "../emotes";
import { RenderQueue, AnimatedEmoteRenderable, EmoteRenderable, ImageRenderable, Renderable } from "../renderable";


class EmoteHandler {
    emote_service: EmoteService;
    lifetime: number;

    constructor (user_id: string, lifetime_secs: number) {
        this.emote_service = new EmoteService(user_id);
        this.lifetime = lifetime_secs * 1000;
    }

    async on_handle_emote_event (channel: string, tags: any, message: string, queue: RenderQueue) {
        const emotes: Renderable[] = [];
        // TODO: Eventually we're going to want to check 7tv for emotes as well
        // for now, we'll just use the twitch emotes

        if (tags.emotes) {
            for (const emote_id in tags.emotes) {
                const emote = await this.emote_service.get_twitch_emote(emote_id);
                const count = tags.emotes[emote_id].length;

                if (!emote) {
                    continue;
                }

                if (emote.animated) {
                    const emote_input = new AnimatedEmoteRenderable({
                        frames: (emote as AnimatedRawEmote).frames,
                        lifetime: this.lifetime,
                        position_x: null,
                        position_y: null,
                    });

                    for (let i = 0; i < count; i++) {
                        emotes.push(emote_input);
                    }
                } else {
                    const emote_input = new EmoteRenderable({
                        image: (emote as RawEmote).image,
                        lifetime: this.lifetime,
                        position_x: null,
                        position_y: null,
                    });

                    for (let i = 0; i < count; i++) {
                        emotes.push(emote_input);
                    }
                }
            }
        }

        // TODO: Eventually we're going to want to check 7tv for emotes as well
        // iterate through each word in the message and check for emotes
        queue.add_items(emotes);
    }    
}


export {
    EmoteHandler,
}
