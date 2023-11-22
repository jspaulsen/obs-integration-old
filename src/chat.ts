import * as tmi from 'tmi.js';


type ChatCallback = (channel: string, tags: tmi.ChatUserstate, message: string) => void;
interface ChatOptions {
    channel: string;
    // optional client_id for twitch api
    client_id?: string;
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
            }
        });

        this.client.on('message', (channel, tags, message) => this.callback(channel, tags, message));
    }

    connect(): void {
        this.client.connect();
    }

    // onMessage(callback) {
    //     this.client.on('message', (channel, tags, message, self) => {
    //         if (self) return;
    //         callback(channel, tags, message);
    //     });
    // }

    // say(channel, message) {
    //     this.client.say(channel, message);
    // }

}


export default ChatClient;

// const tmi = require('tmi.js');
// const client = new tmi.Client({
// 	options: { debug: true },
// 	identity: {
// 		username: 'bot_name',
// 		password: 'oauth:my_bot_token'
// 	},
// 	channels: [ 'my_channel' ]
// });
// client.connect().catch(console.error);
// client.on('message', (channel, tags, message, self) => {
// 	if(self) return;
// 	if(message.toLowerCase() === '!hello') {
// 		client.say(channel, `@${tags.username}, heya!`);
// 	}
// });