import { RenderService } from './renderable';
import { RenderQueue } from './renderable';
import  ChatClient  from './chat';
import { EmoteHandler } from './handlers';
import { EventRouter, TwitchEvent } from './event_router';

import './styles.css';


function resize_canvas(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;
}


async function main(): Promise<void> {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const audio = document.getElementById('audio') as HTMLAudioElement;
    const display = document.getElementById('display') as HTMLDivElement;
    const render_queue = new RenderQueue();

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
    const emote_handler = new EmoteHandler(
        '1', // user_id 
        3, // lifetime_secs
    );

    // setup event router
    event_router.register(
        TwitchEvent.Chat,
        emote_handler.on_handle_emote_event.bind(emote_handler),
    );

    const chat_client = new ChatClient({
        channel: 'cannibaljeebus',
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