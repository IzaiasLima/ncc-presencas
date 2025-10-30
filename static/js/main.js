const IS_LOCALHOST = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

const IS_MOBILE = window.innerWidth <= 580;
const NUM_WEEKS = IS_MOBILE ? 3 : 6;

const API_URL_LOCAL = 'http://localhost:8000';
const API_URL_VERCEL = 'https://ncc-presencas.vercel.app';
const API_URL = (IS_LOCALHOST) ? API_URL_LOCAL : API_URL_VERCEL;

const HEADERS = {
    'Authorization': `Bearer ${window.auth.getToken()}`, 'Content-Type': 'application/json'
}

function rebuild() {
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

function getWeek() {
    var weekElm = document.getElementById('current-week');
    week = (weekElm.value) ? weekElm.value : calcCurrentWeek();
    week = Math.max(1, Math.min(53, week));
    weekElm.value = week;
    return week;
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

    rebuild();
}

// Exibe mensagem tipo TOAST
function showToast(message, err = false, duration = 5000) {
    const toast = document.getElementById('toast');

    toast.classList.add('show');
    toast.innerText = message;

    if (err) {
        toast.style.backgroundColor = '#e74c3c';
    } else {
        toast.style.backgroundColor = '#27ae60';
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
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

// show dialog
async function showPersonDialog(evt) {
    const obj = evt.target;

    const container = obj.getAttribute("container");
    const personId = obj.getAttribute("data-person-id");
    const dlg = document.getElementById('person-details');

    // const personName = document.getElementById("dlg-name");
    // const phoneLink = document.getElementById('dlg-phone');

    const week = getWeek();

    htmx.ajax('GET', `/presence/person/${personId}/${week}/6`, {
        handler: function (element, response) {

            if (response.xhr.status >= 400) {
                showToast(`Os dados não estão disponíveis! (${response.xhr.statusText} Error.)`, true);
            }

            const dados = JSON.parse(response.xhr.responseText);

            console.log(dados.presences);


            dados.telefone = '+55(11) 98888-5544';

            const template = document.getElementById('details-template').innerHTML;
            const details = document.getElementById('person-details');
            details.innerHTML = Mustache.render(template, dados);
            details.classList.add('show');
        }

        // if (person) {
        //     personName.innerHTML = person.name;
        //     phoneLink.innerHTML = `Telefone: ${person.phone}`;
        //     phoneLink.href = `https://wa.me/${person.phone}`;
        //     dlg.classList.add('show');
        // }
    });
}

// close dialog
async function closePersonDialog() {
    const dlg = document.getElementById('person-details');
    dlg.classList.remove('show');
}

function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = cleanPhone(phone);

    if (cleaned.length === 11) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 5)}-${cleaned.substr(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 4)}-${cleaned.substr(6)}`;
    }
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
    rebuild();
}

window.onload = () => rebuild();