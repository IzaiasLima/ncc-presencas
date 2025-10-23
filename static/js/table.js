const header = {
    'Authorization': `Bearer ${window.auth.getToken()}`,
    'Content-Type': 'application/json'
}

async function fetchData(week) {
    week = (!!week) ? week : 1;

    const presenceURL = `${API_URL}/presence/${week}`;

    try {
        const response = await fetch(presenceURL, { headers: header });

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

function calcCurrentWeek() {
    var today = new Date();
    var beginYear = new Date(today.getFullYear(), 0, 1);
    var daysToday = Math.floor((today - beginYear) / (24 * 60 * 60 * 1000));
    var atualWeek = Math.ceil((daysToday + beginYear.getDay() + 1) / 7);

    atualWeek = calcAdjustedWeek(atualWeek)

    return atualWeek;
}

function calcAdjustedWeek(week) {
    week = (week > 52) ? 52 : week;
    week = (week < 1) ? 1 : week;
    return week;
}

function calcInterval(week) {
    const isMobile = window.innerWidth <= 580;
    const qtdSemanas = isMobile ? 2 : 4;
    var weeks = []
    var [week, limit] = (week < 5) ? [week, Number(week) + qtdSemanas] : [Number(week) - qtdSemanas, week];

    for (var i = week; i <= limit; i++) {
        weeks.push(i);
    }
    return weeks
}


function buildPresenceTable(data) {
    const currentWeek = calcCurrentWeek();
    const table = document.getElementById('presence-table');
    const hasNoData = document.getElementById('has-no-data');

    var selectedWeek = document.getElementById('current-week').value;
    selectedWeek = (!!selectedWeek) ? selectedWeek : calcCurrentWeek();
    selectedWeek = calcAdjustedWeek(selectedWeek);

    // Obter todas as semanas únicas e ordenar
    const weeks = calcInterval(selectedWeek);

    var totalSum = new Array(weeks.length).fill(0);

    // Criar cabeçalho
    let headerHTML = '<thead><tr><th>Nome</th>';
    weeks.forEach(week => {
        headerHTML += (week === currentWeek ? `<th class="current-system-week">S${week}★</th>` : `<th>S${week}</th>`);
    });

    headerHTML += '</tr></thead>';

    // Criar corpo da tabela
    let bodyHTML = '<tbody>';

    
    data.person.forEach(person => {
        bodyHTML += `<tr><td class="person-name" data-person-id="${person.id}">${person.name}</td>`;
        
        var tot = 0;
        
        weeks.forEach(week => {

            // Buscar presença para esta pessoa nesta semana
            const presence = data.presence.find(p =>
                p.person_id === person.id && p.week === week
            );

            // Totaliza por semana
            if (presence && presence.present) {
                const v = (!!totalSum[tot]) ? totalSum[tot] : 0;
                totalSum[tot] =  v + 1;
            }

            tot += 1;

            var className = (presence && presence.present) ? 'present' : 'absent';

            bodyHTML += `<td><button class="presence-btn ${className} ${(week === currentWeek ? 'current-system-week' : '')}" data-person-id="${person.id}" data-week="${week}">`;

            bodyHTML += (presence) ? '✓' : '';
            bodyHTML += '</button></td>';
        });

        bodyHTML += '</tr>';

        // Criar diálogo modal com detalhes do participante


    });

    bodyHTML += '</tbody>';

    table.innerHTML = headerHTML + bodyHTML;

    const personName = document.getElementsByClassName('person-name');

    [...personName].forEach(td => {
        td.setAttribute('onclick', 'showPersonDialog(event)');
    });

    const btn = document.getElementsByClassName('presence-btn');
    [...btn].forEach(td => {
        td.setAttribute('onclick', 'updatePresence(event)');
    });

    var total = document.createElement('tr');
    total.style.fontWeight = 'bold';

    var totalLabel = document.createElement('td');
    totalLabel.className = 'total-cell';
    totalLabel.textContent = 'Total';
    total.appendChild(totalLabel);

    // Criar rodapé com totais
    for (var s = 0; s < totalSum.length; s++) {
        var tdTotal = document.createElement('td');
        tdTotal.className = 'total-cell';
        tdTotal.textContent = totalSum[s];
        total.appendChild(tdTotal);
    }

    table.appendChild(total);

}

async function showPersonDialog(evt) {
    const obj = evt.target;
    const personId = obj.getAttribute("data-person-id");
    const dlg = document.getElementById('person-details');
    dlg.classList.add('show');
    console.log(`Person: ${personId}`);
}

async function closePersonDialog() {
    const dlg = document.getElementById('person-details');
    dlg.classList.remove('show');
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
        headers: header,

        body: JSON.stringify({ person_id: personId, week: week, present: !isPresent })
    }).then(response => {
        if (!response.ok) {
            showToast(`Não foi possível registrar a presença (Erro: ${response.status}).`, true);
        }
    });

    rebuild();
}


async function addPerson() {
    const personURL = `${API_URL}/person`;
    const objName = document.getElementById('new-person');
    const objPhone = document.getElementById('new-person-phone');

    const name = objName.value.trim();
    const phone = objPhone.value.trim();

    if (name) {

        await fetch(personURL, {
            method: 'POST',
            headers: header,
            body: JSON.stringify({ name: name, phone: phone })
        }).then(response => {
            if (!response.ok) {
                showToast(`Não foi possível adicionar o participante (Erro: ${response.status}).`, true);
            }
            objName.value = '';
            objPhone.value = '';
        });

        rebuild();
    }
}


function setCurrentWeek() {
    document.getElementById('current-week').value = calcCurrentWeek();
    rebuild();
}


async function rebuild() {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const table = document.getElementById('presence-table');

    var selectedWeek = document.getElementById('current-week').value;
    selectedWeek = (!!selectedWeek) ? selectedWeek : calcCurrentWeek();
    selectedWeek = calcAdjustedWeek(selectedWeek);

    try {
        const data = await fetchData(selectedWeek);

        loadingDiv.style.display = 'none';
        table.style.display = 'table';

        buildPresenceTable(data);
    } catch (error) {

        loadingDiv.style.display = 'none';

        showToast(`Deu ruin! ${error}`, true)
    }
}

rebuild();