// Módulo simples de autenticação
(function () {
    'use strict';

    const KEYS = ['access_token', 'token', 'auth_token', 'jwt', 'app_token'];

    function _getFromStorage(key) {
        try {
            const ls = window.localStorage && localStorage.getItem(key);
            if (ls) return ls;
        } catch (e) {
            // localStorage inacessível
        }
        try {
            const ss = window.sessionStorage && sessionStorage.getItem(key);
            if (ss) return ss;
        } catch (e) {
            // sessionStorage inacessível
        }
        return null;
    }

    function getToken() {
        // procura token local
        for (let i = 0; i < KEYS.length; i++) {
            const k = KEYS[i];
            const v = _getFromStorage(k);
            if (v && typeof v === 'string' && v.trim().length > 0) return v;
        }

        // tenta ler cookie
        try {
            const cookies = document.cookie ? document.cookie.split(';') : [];
            for (let c of cookies) {
                const parts = c.split('=');
                if (parts.length < 2) continue;
                const name = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                if (KEYS.indexOf(name) !== -1 && value) return decodeURIComponent(value);
            }
        } catch (e) {
            // ignore
        }

        return null;
    }

    function isLoggedIn() {
        const t = getToken();
        return !!t;
    }

    // Redireciona para login.html se não estiver autenticado
    function requireLogin(redirectUrl) {
        const url = redirectUrl || 'login.html';
        if (!isLoggedIn()) {
            window.location.assign(url);
            return false;
        }
        return true;
    }

    // Armazena token em localStorage
    function setToken(token, opts) {
        opts = opts || {};
        const persist = opts.persist !== false;
        try {
            if (persist && window.localStorage) {
                localStorage.setItem('access_token', token);
            } else if (window.sessionStorage) {
                sessionStorage.setItem('access_token', token);
            }
            return true;
        } catch (e) {
            try {
                document.cookie = 'access_token=' + encodeURIComponent(token) + '; path=/';
                return true;
            } catch (e2) {
                return false;
            }
        }
    }

    function clearToken() {
        try {
            for (let k of KEYS) {
                try { localStorage.removeItem(k); } catch (e) { }
                try { sessionStorage.removeItem(k); } catch (e) { }
            }
        } catch (e) { }
        try {
            // remover cookie (define expirada)
            for (let k of KEYS) {
                document.cookie = k + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
        } catch (e) { }
    }

    // exporta para uso global
    window.auth = {
        getToken: getToken,
        isLoggedIn: isLoggedIn,
        requireLogin: requireLogin,
        setToken: setToken,
        clearToken: clearToken,
    };

})();
