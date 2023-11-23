import ChatService from './chat_service';
import { Renderer } from './render';

import './styles.css';



function resize_canvas(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;
}


function main(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    
    // size the canvas to the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const renderer = new Renderer({
        canvas,
        emote_lifetime_secs: 10,
    });

    const manager = new ChatService({
        channel: 'cannibaljeebus',
        renderer,
    });

    // Connect to channel
    manager.connect();
    renderer.render();
}


/* Wait until the DOM is loaded before running the script */
window.addEventListener('DOMContentLoaded', () => {
    main()
});

/* Register the resize event */
window.addEventListener('resize', resize_canvas, false);