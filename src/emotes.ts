
class EmoteService {
    cache: Map<string, string> = new Map();

    async get_emote (emote_id: string): Promise<HTMLImageElement> {
        const image = new Image();

        if (this.cache.has(emote_id)) {
            image.src = this.cache.get(emote_id);
            return image;
        }

        const result = await fetch(get_emote_url(emote_id));

        // if the image is missing, don't add it
        if (!result.ok) {
            return null;
        }

        // convert image into a data url
        const data_url = URL.createObjectURL(await result.blob());

        this.cache.set(emote_id, data_url);
        image.src = data_url;

        return image;
    }
}

function get_emote_url(emote_id: string, theme_mode?: string, scale?: string): string {
    const template = 'https://static-cdn.jtvnw.net/emoticons/v2/<id>/default/<theme_mode>/<scale>';

    return template
        .replace('<id>', emote_id)
        .replace('<theme_mode>', theme_mode || 'dark')
        .replace('<scale>', scale || '2.0');
}

export default EmoteService;
