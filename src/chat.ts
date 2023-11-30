import * as tmi from 'tmi.js';


type ChatCallback = (channel: string, tags: tmi.ChatUserstate, message: string) => Promise<void>;

interface ChatOptions {
    channel: string;
    client_id?: string;
    username? : string;
    password?: string;

    callback: ChatCallback;
}

class ChatClient {
    client: tmi.Client;
    callback: ChatCallback;

    constructor(props: ChatOptions) {
        this.callback = props.callback;
        this.client = new tmi.Client({
            connection: {
                secure: true,
                reconnect: true
            },
            channels: [props.channel],
            options: {
                clientId: props.client_id,
            },
            identity: {
                username: props.username,
                password: props.password,
            },
        });

        this.client.on('message', (channel, tags, message) => this.callback(channel, tags, message));
    }

    connect(): void {
        this.client.connect();
    }
}


export default ChatClient;

