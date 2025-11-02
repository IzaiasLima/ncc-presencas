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

// show dialog
async function showPersonDialog(evt) {
    const obj = evt.target;

    const container = obj.getAttribute("container");
    const personId = obj.getAttribute("data-person-id");
    const dlg = document.getElementById('person-details');

    htmx.ajax('GET', `/presence/person/${personId}`, {
        handler: function (element, response) {
            if (response.xhr.status >= 400) {
                showToast(`Os dados não estão disponíveis! (${response.xhr.statusText} Error.)`, true);
            }

            const dados = JSON.parse(response.xhr.responseText);
            const phone = dados.person.phone;

            dados['formatedPhone'] = formatPhone(phone);
            dados['initials'] = getInitials(dados);

            const template = document.getElementById('details-template').innerHTML;
            const details = document.getElementById('person-details');
            details.innerHTML = Mustache.render(template, dados);
            details.classList.add('show');
        }
    });
}

// close dialog
async function closePersonDialog() {
    const dlg = document.getElementById('person-details');
    dlg.classList.remove('show');
}