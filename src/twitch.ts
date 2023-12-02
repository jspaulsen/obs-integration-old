class TwitchClient {
    token: string;
    client_id: string;

    constructor (token: string, client_id: string) {
        this.token = token;
        this.client_id = client_id;
    }

    async get_channel_id (channel: string): Promise<string | null> {
        const url = new URL('https://api.twitch.tv/helix/users');

        url.searchParams.append('login', channel);

        const response = await fetch(url.toString(), {
            headers: {
                'Client-ID': this.client_id,
                'Authorization': `Bearer ${this.token}`,
            },
        });

        const json = await response.json();

        if (json.data.length > 0) {
            return json.data[0].id;
        }

        return null;
    }
}

export { 
    TwitchClient,
}