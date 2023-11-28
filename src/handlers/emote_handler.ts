import { AnimatedRawEmote, EmoteService, RawEmote } from "../emotes";
import { RenderQueue, RenderableAnimatedEmoteInput, RenderableEmoteInput, RenderableInput } from "../renderable";


class EmoteHandler {
    emote_service: EmoteService;
    lifetime: number;

    constructor (user_id: string, lifetime_secs: number) {
        this.emote_service = new EmoteService(user_id);
        this.lifetime = lifetime_secs * 1000;
    }

    async on_handle_emote_event (channel: string, tags: any, message: string, queue: RenderQueue) {
        const emotes: RenderableInput[] = [];
        
        console.log(`[${channel}] ${tags['display-name']}: ${message}`);

        // TODO: Eventually we're going to want to check 7tv for emotes as well
        // for now, we'll just use the twitch emotes
        if (tags.emotes) {
            for (const emote_id in tags.emotes) {
                const emote = await this.emote_service.get_twitch_emote(emote_id);

                if (!emote) {
                    continue;
                }

                if (emote.animated) {
                    const emote_input = new RenderableAnimatedEmoteInput({
                        frames: (emote as AnimatedRawEmote).frames,
                        lifetime: this.lifetime,
                    });

                    emotes.push(emote_input);
                } else {
                    const emote_input = new RenderableEmoteInput({
                        image: (emote as RawEmote).image,
                        lifetime: this.lifetime,
                    });

                    emotes.push(emote_input);
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
