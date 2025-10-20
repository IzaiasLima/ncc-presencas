// var participantes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa'];
var participantes = [];


var presencas = {}
// var presencas = {
//     'João Silva-43': true,
//     'Pedro Oliveira-44': true,
//     'Jose-44': true,
//     'Ana Costa-42': true,
//     'João Silva-42': true
// }

const endpointParticipantes = API_URL + '/people';
const endpointPresencas = API_URL + '/presence';

carregarDadosDaApi();

async function carregarDadosDaApi() {
    const headers = {
        'Authorization': `Bearer ${window.auth.getToken()}`,
        'Content-Type': 'application/json'
    }

    try {
        const [resPart, resPres] = await Promise.all([
            fetch(endpointParticipantes, { headers: headers }),
            fetch(endpointPresencas, { headers: headers })
        ]);

        if (resPart && resPart.ok) {
            const data = await resPart.json();
            data.map(pessoa => participantes.push(pessoa.name));

        } else {
            console.warn('Não foi possível carregar lista de participantes:', resPart && resPart.status);
            showToast('Não foi possível carregar lista de participantes. Favor se autenticar novamente.', true);
        }

        if (resPres && resPres.ok) {
            const data = await resPres.json();

            // limpa o objeto presencas
            for (const k in presencas) {
                if (Object.prototype.hasOwnProperty.call(presencas, k)) {
                    delete presencas[k];
                }
            }

            data.map(p => presencas[p.key] = p.present);

        } else {
            console.warn('Não foi possível carregar presenças:', resPres && resPres.status);
            showToast('Não foi possível carregar a lista de presenças. Favor se autenticar novamente.', true);
        }
    } catch (err) {
        console.error('Erro ao carregar dados da API:', err);
    }

    // Função que persiste alteração de uma presença na API
    async function persistirPresenca(chave, valor) {
        await fetch(endpointPresencas, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.auth.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: chave, present: !!valor })
        }).then(response => {
            if (!response.ok) {
                showToast(`Não foi possível registrar a presença (Erro: ${response.status}).`, true);
            }
        });
    }

    // Substitui o objeto presencas por um Proxy que persiste alterações automaticamente
    const storePresencas = presencas;
    presencas = new Proxy(storePresencas, {
        set(target, prop, value) {
            target[prop] = value;
            // persistir de forma assíncrona (não bloqueia a UI)
            persistirPresenca(prop.toString(), value);
            return true;
        },
        deleteProperty(target, prop) {
            const existed = prop in target;
            if (existed) {
                delete target[prop];
                persistirPresenca(prop.toString(), false); // opcional: informar remoção
            }
            return existed;
        }
    });

    atualizarTela();
}

function calcularSemanaAtual() {
    var hoje = new Date();
    var inicioAno = new Date(hoje.getFullYear(), 0, 1);
    var diasPassados = Math.floor((hoje - inicioAno) / (24 * 60 * 60 * 1000));
    var semanaAtual = Math.ceil((diasPassados + inicioAno.getDay() + 1) / 7);

    if (semanaAtual > 52) semanaAtual = 52;
    if (semanaAtual < 1) semanaAtual = 1;

    return semanaAtual;
}

var semanaAtualSistema = calcularSemanaAtual();

async function adicionarParticipante() {
    var input = document.getElementById('novoParticipante');
    var nome = input.value.trim();

    if (nome) {
        participantes.push(nome);
        input.value = '';


        await fetch(endpointParticipantes, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.auth.getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: nome, phone: '61 00000-0000' })
        }).then(response => {
            if (!response.ok) {
                showToast(`Não foi possível registrar participante (Erro: ${response.status}).`, true);
            }
        });

        atualizarTela();
    }
}

function removerParticipante(index) {
    participantes.splice(index, 1);
    atualizarTela();
}

function togglePresenca(participante, semana) {
    var chave = participante + '-' + semana;
    presencas[chave] = !presencas[chave];
    atualizarTela();

    // console.log(presencas);

}

function calcularTotalSemana(semana) {
    var total = 0;
    for (var p = 0; p < participantes.length; p++) {
        var chave = participantes[p] + '-' + semana;
        if (presencas[chave]) {
            total++;
        }
    }
    return total;
}

function getSemanasVisiveis() {
    var semanaAtual = parseInt(document.getElementById('semanaAtual').value) || semanaAtualSistema;
    var semanas = [];

    const isMobile = window.innerWidth <= 580;
    const qtdSemanas = isMobile ? 3 : 5;

    for (var i = 0; i < qtdSemanas; i++) {
        var semana = Math.min(52, Math.max(1, semanaAtual - 2 + i));
        if (semanas.length === 0 || semanas[semanas.length - 1] !== semana) {
            semanas.push(semana);
        }
    }

    return semanas;
}

function selecionarSemanaAtual() {
    document.getElementById('semanaAtual').value = semanaAtualSistema;
    atualizarTela()
}

function atualizarTela() {
    var tabela = document.getElementById('tabelaFrequencia');
    var estadoVazio = document.getElementById('estadoVazio');

    if (participantes.length === 0) {
        tabela.style.display = 'none';
        estadoVazio.style.display = 'block';
        return;
    }

    tabela.style.display = 'table';
    estadoVazio.style.display = 'none';

    var semanasVisiveis = getSemanasVisiveis();

    var cabecalho = document.getElementById('cabecalho');
    cabecalho.innerHTML = '<th>Participante</th>';

    for (var i = 0; i < semanasVisiveis.length; i++) {
        var semana = semanasVisiveis[i];
        var estilo = semana === semanaAtualSistema ? 'text-align: center; background-color: #e1fdddff; font-weight: bold;' : 'text-align: center;';
        var label = (semana === semanaAtualSistema ? '★' : 'S' + semana);
        cabecalho.innerHTML += `<th style="${estilo}">${label}</th>`;
    }

    // cabecalho.innerHTML += '<th style="text-align: center;">Ações</th>';

    var corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';

    for (var p = 0; p < participantes.length; p++) {
        var participante = participantes[p];
        var linha = document.createElement('tr');

        var tdNome = document.createElement('td');
        tdNome.style.fontWeight = '500';
        // tdNome.textContent = participante;

        var action = document.createElement('a');
        action.className = 'action';
        action.innerHTML = participante;
        action.setAttribute('data-index', p);

        action.onclick = function () {
            var idx = parseInt(this.getAttribute('data-index'));
            const msgTemp = `Frequência de ${participantes[idx]}: \nDetalhes indisponíveis.`;
            showToast(msgTemp);
        };

        tdNome.appendChild(action);

        linha.appendChild(tdNome);

        for (var s = 0; s < semanasVisiveis.length; s++) {
            var semana = semanasVisiveis[s];
            var td = document.createElement('td');
            td.style.textAlign = 'center';

            if (semana === semanaAtualSistema) {
                td.style.backgroundColor = '#f0fcf0ff';
            }

            var chave = participante + '-' + semana;
            var presente = presencas[chave];
            var btn = document.createElement('button');
            btn.className = 'presenca-btn ' + (presente ? 'presente' : 'ausente');
            btn.innerHTML = presente ? '✓' : '';
            btn.setAttribute('data-participante', participante);
            btn.setAttribute('data-semana', semana);

            // Define semana ativa apenas para a semana atual do sistema
            // if (semana !== semanaAtualSistema) {
            if (false) {
                btn.disabled = true;
                btn.style.cursor = 'not-allowed';
                btn.style.opacity = '0.5';
            } else {
                btn.onclick = function () {
                    var part = this.getAttribute('data-participante');
                    var sem = this.getAttribute('data-semana');
                    togglePresenca(part, sem);
                };
            }

            td.appendChild(btn);
            linha.appendChild(td);
        }

        // Coluna AÇÕES
        var tdAcoes = document.createElement('td');
        tdAcoes.style.textAlign = 'center';
        var btnActions = document.createElement('button');
        btnActions.className = 'btn-actions';
        btnActions.innerHTML = '<span class="fa fa-bar-chart"></span>';

        btnActions.setAttribute('data-index', p);

        btnActions.onclick = function () {
            var idx = parseInt(this.getAttribute('data-index'));
            const msgTemp = `Frequência de ${participantes[idx]}: \nDetalhes indisponíveis.`;
            showToast(msgTemp);
        };

        tdAcoes.appendChild(btnActions);
        // linha.appendChild(tdAcoes);

        corpo.appendChild(linha);
    }

    var linhaTotal = document.createElement('tr');
    linhaTotal.style.fontWeight = 'bold';

    var tdTotalLabel = document.createElement('td');
    tdTotalLabel.className = 'total-cell';
    tdTotalLabel.textContent = 'Total';
    linhaTotal.appendChild(tdTotalLabel);

    for (var s = 0; s < semanasVisiveis.length; s++) {
        var semana = semanasVisiveis[s];
        var tdTotal = document.createElement('td');
        tdTotal.className = 'total-cell';
        if (semana === semanaAtualSistema) {
            tdTotal.style.backgroundColor = '#e1fdddff';
        }
        tdTotal.textContent = calcularTotalSemana(semana);
        linhaTotal.appendChild(tdTotal);
    }

    // var tdAcoesVazio = document.createElement('td');
    // linhaTotal.appendChild(tdAcoesVazio);

    corpo.appendChild(linhaTotal);
}

function exportarCSV() {
    var csv = 'Participante,';
    for (var i = 1; i <= 52; i++) {
        csv += 'Semana ' + i;
        if (i < 52) csv += ',';
    }
    csv += ',Total\n';

    for (var p = 0; p < participantes.length; p++) {
        var participante = participantes[p];
        var linha = participante;
        var total = 0;

        for (var semana = 1; semana <= 52; semana++) {
            var chave = participante + '-' + semana;
            var presente = presencas[chave];
            linha += ',' + (presente ? 'P' : '');
            if (presente) total++;
        }

        linha += ',' + total;
        csv += linha + '\n';
    }

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'frequencia_evento.csv';
    link.click();
}

atualizarTela();