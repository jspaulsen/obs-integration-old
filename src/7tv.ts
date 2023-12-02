interface EmoteFile {
    name: string;
    static_name: string;
    width: number;
    height: number;
    frame_count: number;
    size: number;
    format: string;
}

interface EmoteHost {
    url: string;
    files: EmoteFile[];
}

interface EmoteData {
    id: string;
    name: string;
    host: EmoteHost;
    animated: boolean;
}

interface Emote {
    data: EmoteData;
    name: string;
}

interface EmoteSet {
    emotes: Emote[];
}

interface UserResponse {
    emote_set: EmoteSet;
}


class SevenTVEmote {
    name: string;
    image_url: string;
    animated: boolean;
    is_valid: boolean = true;

    constructor (emote: Emote) {
        const host_url = 'https:' + emote.data.host.url;

        // find the 2x.webp file; if not found, use the first webp file
        const image = emote.data.host.files.find((file) => file.name.endsWith('2x.webp')) || emote.data.host.files.find((file) => file.name.endsWith('.webp'));
        
        if (!image) {
            this.is_valid = false;
        }

        this.name = emote.name;
        this.image_url = host_url + '/' + image.name;
    }
}

class SevenTV {
    user_id: string;
    emotes: Map<string, SevenTVEmote> = new Map();
    emote_set: string | null = null;

    constructor(user_id: string) {
        this.user_id = user_id;
    }

    async _get_emote_set (): Promise<Map<string, SevenTVEmote>> {
        const url = new URL(`https://7tv.io/v3/users/twitch/${this.user_id}`);

        const response = await fetch(url.toString());
        const json = await response.json();

        const emotes = new Map();

        console.log(json)

        for (const emote of json.emote_set.emotes) {
            const emote_obj = new SevenTVEmote(emote);

            if (emote_obj.is_valid) {
                emotes.set(emote.name, emote_obj);
            }
        }

        return emotes;
    }

    async get_emote (name: string): Promise<SevenTVEmote | null> {
        if (!this.emote_set) {
            const emote_set = await this._get_emote_set();

            this.emotes = emote_set;
            this.emote_set = this.user_id;
        }

        return this.emotes.get(name) || null;
    }
}

export {
    SevenTV,
    SevenTVEmote,
}