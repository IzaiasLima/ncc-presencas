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

    htmx.ajax('GET', `/presence/${week}/${NUM_WEEKS}`, {
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

function getWeek() {
    var weekElm = document.getElementById('current-week');
    week = (weekElm.value) ? weekElm.value : calcCurrentWeek();
    week = Math.max(1, Math.min(53, week));
    weekElm.value = week;
    return week;
}


// detecta click repetido em h2Title
const btnPresence = document.getElementsByClassName('presence');
const h2Title = document.getElementById('h2-title');
var h2TitleClick = 0;

h2Title.addEventListener('click', (event) => {
    if (event.ctrlKey) {
        h2TitleClick += 1;

        if (h2TitleClick > 7) {
            [...btnPresence].forEach(btn => {
                btn.classList.add('alterable');
            });
        }
    }

    if (event.shiftKey) {
        h2TitleClick = 0;
        [...btnPresence].forEach(btn => {
            btn.classList.remove('alterable');
        });
    }
});

function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = cleanPhone(phone);

    if (cleaned.length === 11) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 5)}-${cleaned.substr(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 4)}-${cleaned.substr(6)}`;
    }
}

function getInitials(dados) {
    return dados.person.name.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
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