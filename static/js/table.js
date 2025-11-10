// Adicionar pessoa na API
async function addPerson() {
    const personName = document.getElementById('person-name').value;
    const personPhone = document.getElementById('person-phone').value;
    const personURL = `${API_URL}/person`;

    await fetch(personURL, {
        method: 'POST',
        headers: HEADERS,

        body: JSON.stringify({ name: personName, phone: personPhone })
    }).then(response => {
        if (!response.ok) {
            showToast(`Não foi possível cadastrar o participante. (Erro: ${response}).`, true);
        }
    });

    personPhone = '';
    personName = '';

    renderPresences();
}

async function deletePerson(evt) {
    const obj = evt.target;
    const personId = obj.getAttribute("data-person-id");
    const personName = obj.getAttribute("data-person-name");
    const personURL = `${API_URL}/person/${personId}`;

    if (window.confirm(`Vai mesmo excluir ${personName.toUpperCase()}?`)) {
        await fetch(personURL, {
            method: 'DELETE',
            headers: HEADERS,

            // body: JSON.stringify({ name: personName, phone: personPhone })
        }).then(response => {
            if (!response.ok) {
                showToast(`Não foi possível excluir o participante. (Erro: ${response.statusText}).`, true);
            }
        });
    }

    renderPresences();
}

function renderPresences() {
    const week = getWeek();
    // const nucleos = document.getElementById('nucleos');
    const nucleo = parseInt(document.getElementById('nucleo')?.value);

    var PRESENCE_URL = `/presence/${week}/${NUM_WEEKS}`

    if (nucleo && nucleo > 0) {
        PRESENCE_URL = `${PRESENCE_URL}/${nucleo}`;
    }

    htmx.ajax('GET', PRESENCE_URL, {
        handler: function (element, response) {
            if (response.xhr.status >= 400) {
                showToast(`Os dados não estão disponíveis! (${response.xhr.statusText} Error.)`, true);
            }

            const dados = JSON.parse(response.xhr.responseText);
            const template = document.getElementById('presences-matrix').innerHTML;
            const result = document.getElementById('result');

            if (dados.summary.totalPresent === 0) {
                showToast(`Não há dados na semana ${week}, nem nas próximas.`, true);
            }
            result.innerHTML = Mustache.render(template, dados);

            // renderiza o select se houver uma lista de nucleos
            const btnsPresence = document.getElementsByClassName('presence');
            const templateSelect = document.getElementById('select-template').innerHTML;
            const personAdd = document.getElementById('person-add');
            const nucleosSelect = document.getElementById('nucleos-select');
            nucleosSelect.innerHTML = Mustache.render(templateSelect, dados);

            // ACESSO PELA SECRETARIA
            if (dados.nucleos.length > 0) {
                // exibe selecionar núcleo, se houver lista de nucleos
                nucleosSelect?.classList.add('show');

                // exclui a class que permite editar semana atual
                [...btnsPresence].forEach(btn => { btn.classList.remove('current-week') });

                // exibe o nome do NCC
                const nccNameElm = document.getElementById('ncc-name');
                [...dados.nucleos].forEach(n => { if (n.ncc_id === nucleo) nccNameElm.innerHTML = n.ncc_name; });

            } else {
                // exibe adicionar participante
                personAdd?.classList.add('show');
            }
        }
    });
}

// Função que persiste alteração de uma presença na API
async function updatePresence(evt) {
    const btn = evt.target;
    const personId = btn.getAttribute("data-person-id");
    const week = btn.getAttribute("data-week");
    const isPresent = btn.classList.contains('present');
    btn.classList.toggle('present');

    const presenceURL = `${API_URL}/presence`;

    await fetch(presenceURL, {
        method: 'POST',
        headers: HEADERS,

        body: JSON.stringify({ person_id: personId, week: week, present: !isPresent })
    }).then(response => {
        if (!response.ok) {
            showToast(`Não foi possível registrar a presença (Erro: ${response.status}).`, true);
        }
    });
}

function getWeek() {
    var weekElm = document.getElementById('current-week');
    week = (weekElm.value) ? weekElm.value : calcCurrentWeek();
    week = Math.max(1, Math.min(53, week));
    weekElm.value = week;
    return week;
}

// calcula semana atual
function calcCurrentWeek() {
    var today = new Date();
    var beginYear = new Date(today.getFullYear(), 0, 1);
    var daysToday = Math.floor((today - beginYear) / (24 * 60 * 60 * 1000));
    var atualWeek = Math.ceil((daysToday + beginYear.getDay() + 1) / 7);

    return Math.max(1, Math.min(53, atualWeek));
}

// seta semana atual no input
function setCurrentWeek() {
    const elm = document.getElementById('current-week');
    elm.value = calcCurrentWeek();
    renderPresences();
}

window.onload = () => renderPresences();