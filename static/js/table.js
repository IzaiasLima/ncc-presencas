const presenceURL = `${API_URL}/presence`

const header = {
    'Authorization': `Bearer ${window.auth.getToken()}`,
    'Content-Type': 'application/json'
}


async function fetchData() {
    try {
        const response = await fetch(presenceURL, { headers: header });
        // headers: {
        //     'Authorization': `Bearer ${window.auth.getToken()}`,
        //     'Content-Type': 'application/json'
        // }
        // });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        throw error;
    }
}

const semanaAtual = calcSemanaAtual()

function calcSemanaAtual() {
    var hoje = new Date();
    var inicioAno = new Date(hoje.getFullYear(), 0, 1);
    var diasPassados = Math.floor((hoje - inicioAno) / (24 * 60 * 60 * 1000));
    var semanaAtual = Math.ceil((diasPassados + inicioAno.getDay() + 1) / 7);

    if (semanaAtual > 52) semanaAtual = 52;
    if (semanaAtual < 1) semanaAtual = 1;

    return semanaAtual;
}


function buildPresenceTable(data) {
    const table = document.getElementById('presenceTable');

    // Obter todas as semanas únicas e ordenar
    const weeks = [...new Set(data.presence.map(p => p.week))].sort((a, b) => a - b);

    const semanaAtuall = 30

    // Criar cabeçalho
    let headerHTML = '<thead><tr><th>Nome</th>';
    weeks.forEach(week => {
        headerHTML += (week === semanaAtuall ? `<th class="semana-atual">S${week}★</th>` : `<th>S${week}</th>`);
    });

    headerHTML += '</tr></thead>';

    // Criar corpo da tabela
    let bodyHTML = '<tbody>';
    data.person.forEach(person => {
        bodyHTML += `<tr><td>${person.name}</td>`;

        weeks.forEach(week => {
            // Buscar presença para esta pessoa nesta semana
            const presence = data.presence.find(p =>
                p.person_id === person.id && p.week === week
            );

            var className = (presence && presence.present) ? 'presente' : 'ausente';

            bodyHTML += `<td><button class="presenca-btn ${className}" data-person-id="${person.id}" data-week="${week}">`;
            bodyHTML += (presence) ? '✓' : '';
            bodyHTML += '</button></td>';
            
        });

        bodyHTML += '</tr>';
    });
    bodyHTML += '</tbody>';

    table.innerHTML = headerHTML + bodyHTML;

    const obj = document.getElementsByClassName('presenca-btn');
    const tds = [...obj];

    tds.forEach(td => {
        td.setAttribute('onclick', 'persistirPresenca(event)');
    });
}


// Função que persiste alteração de uma presença na API
async function persistirPresenca(evt) {
    const btn = evt.target;
    const personId = btn.getAttribute("data-person-id");
    const week = btn.getAttribute("data-week");


    console.log(`${personId}, ${week}`);




    // await fetch(endpointPresencas, {
    //     method: 'POST',
    //     headers: header,

    //     body: JSON.stringify({ key: chave, present: !!valor })
    // }).then(response => {
    //     if (!response.ok) {
    //         showToast(`Não foi possível registrar a presença (Erro: ${response.status}).`, true);
    //     }
    // });
}



async function init() {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const table = document.getElementById('presenceTable');

    try {
        const data = await fetchData();

        loadingDiv.style.display = 'none';
        table.style.display = 'table';

        buildPresenceTable(data);
    } catch (error) {

        loadingDiv.style.display = 'none';

        showToast(`Deu ruin! ${error}`, true)
    }
}

init();