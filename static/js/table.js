// Adicionar pessoa na API
async function addPerson() {
    const personName = document.getElementById('person-name');
    const personPhone = document.getElementById('person-phone');

    const personURL = `${API_URL}/person`;

    await fetch(personURL, {
        method: 'POST',
        headers: HEADERS,

        body: JSON.stringify({ name: personName.value, phone: personPhone.value })
    }).then(response => {
        if (!response.ok) {
            showToast(`Não foi possível cadastrar o participante. (Erro: ${response.status}).`, true);
        }
    });
    renderPresences();
}

function renderPresences() {
    const week = getWeek();
    // const nucleos = document.getElementById('nucleos');
    const nucleo = document.getElementById('nucleo')?.value;

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
            const templateSelect = document.getElementById('select-template').innerHTML;
            const nucleosSelect = document.getElementById('nucleos-select');
            nucleosSelect.innerHTML = Mustache.render(templateSelect, dados);

            if (dados.nucleos.length > 0) {
                // exibe o select se houver lista de nucleos
                nucleosSelect?.classList.add('show');
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

    const presenceURL = `${API_URL}/presence`;

    console.log('ok');


    await fetch(presenceURL, {
        method: 'POST',
        headers: HEADERS,

        body: JSON.stringify({ person_id: personId, week: week, present: !isPresent })
    }).then(response => {
        if (!response.ok) {
            showToast(`Não foi possível registrar a presença (Erro: ${response.status}).`, true);
        }
    });

    renderPresences();
}

function hasValue(val) {
    if (val === undefined || val === nulll || val < 1) {
        return false;
    }
    return true;
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