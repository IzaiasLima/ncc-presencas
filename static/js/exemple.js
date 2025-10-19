// Exemplo de uso:
const api = createApiClient('http://localhost:8000');

(async () => {
    await api.login('user@example.com', 'user');
    const perfil = await api.get('/me');
    console.log(perfil);
})();