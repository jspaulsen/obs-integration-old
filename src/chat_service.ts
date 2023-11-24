import ChatClient from "./chat";
import { RenderService, ChatEmote } from "./render";


interface ChatServiceOptions {
    client_id?: string;
    channel: string;
    renderer: RenderService;
}

class ChatService {
    renderer: RenderService;
    client: ChatClient;

    constructor({ channel, renderer }: ChatServiceOptions) {
        this.renderer = renderer;
        this.client = new ChatClient({
            channel,
            client_id: null,
            callback: this.on_chat_event.bind(this)
        });
    }

    async on_chat_event(channel: string, tags: any, message: string): Promise<void> {
        const emotes: ChatEmote[] = [];
        
        console.log(`[${channel}] ${tags['display-name']}: ${message}`);
        // TODO: Eventually we're going to want to check 7tv for emotes as well
        // for now, we'll just use the twitch emotes
        if (tags.emotes) {
            for (const emote_id in tags.emotes) {
                emotes.push({ id: emote_id });
            }
        }

        // iterate through each word in the message and check for emotes

        await this.renderer.add_emotes(emotes);
    }

    connect(): void {
        this.client.connect();
    }
}

export default ChatService;