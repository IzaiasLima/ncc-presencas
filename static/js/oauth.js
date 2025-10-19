

function createApiClient(baseUrl) {
    const base = new URL(baseUrl, (typeof window !== 'undefined'
        && window.location) ? window.location.href : 'http://localhost:8000');

    let token = null;

    // interno: faz a requisição usando fetch e retorna JSON (ou lança erro)
    async function httpRequest(method, path, body = null, extraHeaders = {}) {
        const url = new URL(path, base);
        const headers = Object.assign({}, extraHeaders);
        const opts = {
            method,
            headers,
            credentials: 'include',
        };

        if (body != null) {
                   opts.body = JSON.stringify(body);
        }

        if (typeof fetch === 'undefined') {
            throw new Error('Funcao fetch não disponível.');
        }

        const res = await fetch(url.toString(), opts);
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        const raw = await res.text();
        let parsed = raw;
        if (contentType.includes('application/json') && raw) {
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                parsed = raw;
            }
        }

        if (res.ok) {
            return parsed;
        }

        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        err.body = parsed;
        throw err;
    }

    // Faz login em /token e espera receber JSON com o access_token.
    async function login(email, password) {
        if (!email || !password) throw new Error('Necessita informar email e password');
        const resp = await httpRequest('POST', '/token', { email, password });

        // tenta extrair o token
        const candidate =
            (resp &&
                (resp.access_token || resp.token || resp.bearer_token || (resp.token_type
                    && resp.token_type === 'Bearer' && resp.access_token))) || null;

        if (typeof candidate === 'string' && candidate.length > 0) {
            token = candidate;
            return { token };
        }

        throw new Error('Resposta não contém um token válido');
    }

    function setToken(t) {
        token = t;
    }

    function getToken() {
        return token;
    }

    // Adiciona Authorization: Bearer <token> nas proximas requisicoes
    async function request(method, path, body = null, extraHeaders = {}) {
        if (!token) throw new Error('Cliente não autenticado. Favor fazer login.');
        const headers = Object.assign({}, extraHeaders, {
            Authorization: `Bearer ${token}`,
        });
        return httpRequest(method, path, body, headers);
    }

    // atalhos para os verbos HTTP comuns
    const get = (path, extraHeaders) => request('GET', path, null, extraHeaders);
    const post = (path, body, extraHeaders) => request('POST', path, body, extraHeaders);
    const put = (path, body, extraHeaders) => request('PUT', path, body, extraHeaders);
    const del = (path, extraHeaders) => request('DELETE', path, null, extraHeaders);

    return { login, setToken, getToken, request, get, post, put, delete: del, };
}

if (typeof window !== 'undefined') {
    window.createApiClient = createApiClient;
}

