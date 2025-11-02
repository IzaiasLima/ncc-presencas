function renderTable() {
    htmx.ajax('GET', "/presence", {
        handler: function (element, response) {

            if (response.xhr.status >= 400) {
                showToast(`Usuário sem permissão para acessar os dados! (${response.xhr.statusText} Error.)`, true);
            }

            const dados = JSON.parse(response.xhr.responseText);
            const template = document.getElementById('presences-matrix').innerHTML;
            const result = document.getElementById('result');
            result.innerHTML = Mustache.render(template, dados);
        }
    });
}

window.onload = () => renderTable();