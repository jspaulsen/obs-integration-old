interface TwitchOAuthOpts {
    client_id: string;
    scope: string[];
}


class TwitchOAuth {
    private client_id: string;
    private scope: string[];

    constructor (opts: TwitchOAuthOpts) {
        this.client_id = opts.client_id;
        this.scope = opts.scope;
    }

    get_oauth_token (): string | null {
        const token = localStorage.getItem('oauth_token');

        if (token) {
            return token;
        }

        return null;
    }

    handle_potential_redirect (): void {
        const search_params = new URLSearchParams(window.location.hash);
        const token = search_params.get('#access_token');

        if (token) {
            localStorage.setItem('oauth_token', token);
        }
    }

    get_auth_url(): string {
        const url = new URL('https://id.twitch.tv/oauth2/authorize');
        const current_url = new URL(window.location.href);

        // Remove any query params
        current_url.search = '';
        current_url.hash = '';
        
        // make sure there is a trailing slash
        if (!current_url.pathname.endsWith('/')) {
            current_url.pathname += '/';
        }

        url.searchParams.append('response_type', 'token');
        url.searchParams.append('client_id', this.client_id);
        // url encoded
        url.searchParams.append('redirect_uri', current_url.toString());
        url.searchParams.append('scope', this.scope.join(' '));

        return url.toString();
    }
}

export {
    TwitchOAuth,
    TwitchOAuthOpts,
}
