import ChatClient from "./chat";
import { Renderer, Emote } from "./render";


interface ChatServiceOptions {
    client_id?: string;
    channel: string;
    renderer: Renderer;
}

class ChatService {
    renderer: Renderer;
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
        const emotes: Emote[] = [];
        
        console.log(`[${channel}] ${tags['display-name']}: ${message}`);
        // TODO: Eventually we're going to want to check 7tv for emotes as well
        // for now, we'll just use the twitch emotes
        if (tags.emotes) {
            for (const emote_id in tags.emotes) {
                emotes.push({ id: emote_id });
            }
        }

        await this.renderer.add_emotes(emotes);
    }

    connect(): void {
        this.client.connect();
    }
}

export default ChatService;