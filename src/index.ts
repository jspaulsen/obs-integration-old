import { RenderService } from './renderable';
import { RenderQueue } from './renderable';
import  ChatClient  from './chat';
import { EmoteHandler, CommandHandler } from './handlers';
import { EventRouter, TwitchEvent } from './event_router';
import { ExampleCommand } from './commands';

import './styles.css';


function resize_canvas(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;
}

// First audio
// https://www.youtube.com/watch?v=OMmgAS5dmhA&ab_channel=AdultSwim


async function main(): Promise<void> {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const audio = document.getElementById('audio') as HTMLAudioElement;
    const display = document.getElementById('display') as HTMLDivElement;
    const render_queue = new RenderQueue();

    // get the lifetime of the emotes from query params
    const url = new URL(window.location.href);
    const lifetime = url.searchParams.get('lifetime');
    const user_id = url.searchParams.get('user_id');
    const lifetime_secs = lifetime ? parseInt(lifetime) : 3;

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
    command_handler.register_command(new ExampleCommand());

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
        channel: 'cannibaljeebus',
        // username: 'cannibaljeebus',
        // password: 'oauth:abc123',
        //client_id: 'abc123', // TODO:
        callback: event_router.on_chat_event.bind(event_router),
    });

    // Connect to channel
    chat_client.connect();
    renderer.render();
}


/* Wait until the DOM is loaded before running the script */
window.addEventListener('DOMContentLoaded', () => {
    main();
});

/* Register the resize event */
window.addEventListener('resize', resize_canvas, false);

/* Register error handler */
window.addEventListener('error', (e) => {
    const body = document.getElementsByTagName('body')[0];
    const error = document.createElement('div');
    const message = document.createElement('p'); 

    message.style.color = 'red';
    message.style.fontSize = '2em';
    message.innerText = e.message;

    error.appendChild(message);
    body.appendChild(error);
});