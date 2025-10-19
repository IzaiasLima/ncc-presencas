var participantes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa'];
var presencas = {};

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

function adicionarParticipante() {
    var input = document.getElementById('novoParticipante');
    var nome = input.value.trim();

    if (nome) {
        participantes.push(nome);
        input.value = '';
        atualizarTabela();

        document.getElementById('semanaAtual').value = semanaAtualSistema;
        document.getElementById('semanaAtualLabel').textContent = semanaAtualSistema;
        atualizarTabela();
    }
}

function removerParticipante(index) {
    participantes.splice(index, 1);
    atualizarTabela();
}

function togglePresenca(participante, semana) {
    var chave = participante + '-' + semana;
    presencas[chave] = !presencas[chave];
    atualizarTabela();
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

    for (var i = 0; i < 5; i++) {
        var semana = Math.min(52, Math.max(1, semanaAtual - 2 + i));
        if (semanas.length === 0 || semanas[semanas.length - 1] !== semana) {
            semanas.push(semana);
        }
    }

    return semanas;
}

function selecionarSemanaAtual(){
    document.getElementById('semanaAtual').value = semanaAtualSistema;
    atualizarTabela()
}

function atualizarTabela() {
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
        cabecalho.innerHTML += '<th style="' + estilo + '">S' + semana + (semana === semanaAtualSistema ? ' ★' : '') + '</th>';
    }

    cabecalho.innerHTML += '<th style="text-align: center;">Ações</th>';

    var corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';

    for (var p = 0; p < participantes.length; p++) {
        var participante = participantes[p];
        var linha = document.createElement('tr');

        var tdNome = document.createElement('td');
        tdNome.style.fontWeight = '500';
        tdNome.textContent = participante;
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

            if (semana !== semanaAtualSistema) {
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

        var tdAcoes = document.createElement('td');
        tdAcoes.style.textAlign = 'center';
        var btnRemover = document.createElement('button');
        btnRemover.className = 'remove-btn';
        btnRemover.innerHTML = '×';
        btnRemover.setAttribute('data-index', p);
        btnRemover.onclick = function () {
            var idx = parseInt(this.getAttribute('data-index'));
            removerParticipante(idx);
        };
        tdAcoes.appendChild(btnRemover);
        linha.appendChild(tdAcoes);

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

    var tdAcoesVazio = document.createElement('td');
    linhaTotal.appendChild(tdAcoesVazio);

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

atualizarTabela();