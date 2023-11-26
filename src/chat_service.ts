import ChatClient from "./chat";
import { RenderQueue, RenderableInput, RenderableAnimatedEmoteInput, RenderableEmoteInput } from "./renderable";
import { EmoteService, BaseEmote, RawEmote, AnimatedRawEmote } from "./emotes";


interface ChatServiceOptions {
    client_id?: string;
    user_id?: string;
    channel: string;
    queue: RenderQueue;
    emote_lifetime_secs: number;
}

class ChatService {
    queue: RenderQueue;
    client: ChatClient;
    emote_service: EmoteService = new EmoteService('1');
    emote_lifetime: number = 1000;

    constructor(opts: ChatServiceOptions) {
        this.queue = opts.queue;
        this.emote_lifetime = (opts.emote_lifetime_secs || this.emote_lifetime) * 1000;
        this.client = new ChatClient({
            channel: opts.channel,
            client_id: opts.client_id || null,
            callback: this.on_chat_event.bind(this)
        });
    }

    async on_chat_event(channel: string, tags: any, message: string): Promise<void> {
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
                        lifetime: 0,
                    });

                    emotes.push(emote_input);
                } else {
                    const emote_input = new RenderableEmoteInput({
                        image: (emote as RawEmote).image,
                        lifetime: 0,
                    });

                    emotes.push(emote_input);
                }
            }
        }

        // TODO: Eventually we're going to want to check 7tv for emotes as well
        // iterate through each word in the message and check for emotes
        this.queue.add_items(emotes);

    }

    connect(): void {
        this.client.connect();
    }
}

export default ChatService;