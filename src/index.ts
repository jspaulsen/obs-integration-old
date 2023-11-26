import ChatService from './chat_service';
import { RenderService } from './renderable/render';
import { RenderQueue } from './renderable';

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
        render_queue,
        user_id: '1', // TODO: get this from the twitch api
    });

    const manager = new ChatService({
        channel: 'cannibaljeebus',
        queue: render_queue,
        client_id: '9z6j3m7q2x8q7q9n3x3g2j8t6z6j3m',
        user_id: '1',
        emote_lifetime_secs: 2,
    });

    // Connect to channel
    manager.connect();
    renderer.render();
}


/* Wait until the DOM is loaded before running the script */
window.addEventListener('DOMContentLoaded', () => {
    main();
});

/* Register the resize event */
window.addEventListener('resize', resize_canvas, false);