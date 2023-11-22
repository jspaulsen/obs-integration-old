import ChatClient from "./chat";

import './styles.css';


function get_emote_url(emote_id: string, theme_mode?: string, scale?: string): string {
    const template = 'https://static-cdn.jtvnw.net/emoticons/v2/<id>/default/<theme_mode>/<scale>';

    return template
        .replace('<id>', emote_id)
        .replace('<theme_mode>', theme_mode || 'dark')
        .replace('<scale>', scale || '2.0');
}


function main(): void {
    const root = document.getElementById('root');
    const client = new ChatClient({
        channel: 'cohhcarnage',
        client_id: null,

        callback: (channel, tags, message) => {
            const div = document.createElement('div');
            
            // NOTE: There is a first messsage tag we could use

            // div.classList.add('fade-in-out');
            // div.innerText = `${tags.username}: ${message}`;

            if (tags.emotes) {
                // for each emote, find the image and add it
                for (const emote_id in tags.emotes) {
                    const emote = tags.emotes[emote_id];
                    const emote_url = get_emote_url(emote_id);
                    const img = document.createElement('img');

                    
                    img.src = emote_url;
                    img.classList.add('emote');

                    div.appendChild(img);
                }

                // const emote_url = get_emote_url(emote_id);

                // const img = document.createElement('img');
                // img.src = emote_url;
                // img.classList.add('emote');

                // div.prepend(img);
            }

            root.appendChild(div);
        }
    });

    client.connect();
}

function render_loop(timestamp: number): void {

}


function loop(): void {
    // this can be used for rendering; we probably 
    // just need to move images at this frequecy
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    // https://w3schools.com/jsref/met_win_requestanimationframe.asp
    requestAnimationFrame(loop);
}

/* Wait until the DOM is loaded before running the script */
window.addEventListener('DOMContentLoaded', () => {
    main()
});
