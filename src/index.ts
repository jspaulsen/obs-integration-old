import { RenderService } from './renderable';
import { RenderQueue } from './renderable';
import  ChatClient  from './chat';
import { EmoteHandler, CommandHandler } from './handlers';
import { EventRouter, TwitchEvent } from './event_router';
import { DooDooCommand } from './commands';
import { TwitchOAuth } from './oauth';
import { TwitchClient } from './twitch';

import './styles.css';


const CLIENT_ID  = 'x4ialb6ptemxp1pgyyytyckgme7qp7';
const CHANNEL = 'cannibaljeebus';


function resize_canvas(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;
}

async function setup_main(): Promise<void> {
    const url = new URL(window.location.href);

    const oauth = new TwitchOAuth({
        client_id: CLIENT_ID,
        scope: [
            'chat:read',
            'chat:edit',
        ],
    });

    // if there is an error in the url, display it
    const error = url.searchParams.get('error');

    if (error) {
        throw new Error(error + ' ' + url.searchParams.get('error_description'));
    }

    // handle any potential redirects
    oauth.handle_potential_redirect();

    // get the oauth token or redirect to the auth url
    const token = oauth.get_oauth_token();

    if (!token) {
        if (!error) {
            window.location.href = oauth.get_auth_url();
        }
    }

    await main(token);
}


async function main(oauth_token: string): Promise<void> {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const audio = document.getElementById('audio') as HTMLAudioElement;
    const display = document.getElementById('display') as HTMLDivElement;
    const render_queue = new RenderQueue();
    const twitch_client = new TwitchClient(oauth_token, CLIENT_ID);

    // get the lifetime of the emotes from query params
    const url = new URL(window.location.href);
    const lifetime = url.searchParams.get('lifetime');
    const lifetime_secs = lifetime ? parseInt(lifetime) : 3;

    // get channel client id
    const user_id = await twitch_client.get_channel_id(CHANNEL);

    // size the canvas to the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const renderer = new RenderService({
        canvas,
        audio,
        display,
        queue: render_queue,
    });

    const event_router = new EventRouter(render_queue);
    const command_handler = new CommandHandler(render_queue);
    const emote_handler = new EmoteHandler(
        user_id,
        lifetime_secs,
    );

    // register commands
    command_handler.register_command(new DooDooCommand());

    // setup event router
    event_router.register(
        TwitchEvent.Chat,
        emote_handler.on_handle_emote_event.bind(emote_handler),
    );

    // setup command handler
    event_router.register(
        TwitchEvent.Chat,
        command_handler.on_chat_event.bind(command_handler),
    );

    const chat_client = new ChatClient({
        channel: CHANNEL,
        username: CHANNEL,
        password: `oauth:${oauth_token}`, 
        callback: event_router.on_chat_event.bind(event_router),
    });

    // Connect to channel
    chat_client.connect();
    renderer.render();
}


/* Wait until the DOM is loaded before running the script */
window.addEventListener('DOMContentLoaded', () => {
    setup_main();
});

/* Register the resize event */
window.addEventListener('resize', resize_canvas, false);

/* Register error handler */
window.addEventListener('error', (e) => {
    const messages_div = document.getElementById('messages');
    const error = document.createElement('div');
    const message = document.createElement('p'); 

    message.style.color = 'red';
    message.style.fontSize = '2em';
    message.innerText = e.message;

    error.appendChild(message);
    messages_div.appendChild(error);

    console.error(e);
});