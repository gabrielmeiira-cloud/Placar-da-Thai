window.addEventListener('DOMContentLoaded', () => {
    let timesDisponiveis = [];
    let partidas = [];
    let contadorPartidasTimes = {};

    function atualizarPaginaPartidas() {
        carregarTimesSalvos();
        carregarPartidasSalvas();
    }

    function carregarTimesSalvos() {
        const dadosSalvos = localStorage.getItem('times_salvos');
        timesDisponiveis = [];
        if (dadosSalvos) {
            try {
                const parsed = JSON.parse(dadosSalvos);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    parsed.forEach((timeJogadores, index) => {
                        if (Array.isArray(timeJogadores) && timeJogadores.length > 0) {
                            timesDisponiveis.push(`Time ${index + 1} (${timeJogadores.map(j => j.nome).join(' & ')})`);
                        }
                    });
                }
            } catch(e) {}
        }
        recalcularContadoresMemoria();
        atualizarPainelTimesStatus();
    }

    function recalcularContadoresMemoria() {
        contadorPartidasTimes = {};
        timesDisponiveis.forEach(t => contadorPartidasTimes[t] = 0);
        partidas.forEach(p => {
            if (contadorPartidasTimes[p.time1] !== undefined) contadorPartidasTimes[p.time1]++;
            if (contadorPartidasTimes[p.time2] !== undefined) contadorPartidasTimes[p.time2]++;
        });
    }

    function atualizarPainelTimesStatus() {
        const infoStatus = document.getElementById('infoTimesStatus');
        if(!infoStatus) return;
        if (timesDisponiveis.length > 0) {
            let htmlLista = `👥 <strong>Times carregados (${timesDisponiveis.length}):</strong><div class="lista-times-container">`;
            timesDisponiveis.forEach(t => {
                htmlLista += `<div class="item-time-lista"><span>• ${t}</span> <span class="contador-jogos-badge">${contadorPartidasTimes[t] || 0} jogos</span></div>`;
            });
            htmlLista += '</div>';
            infoStatus.innerHTML = htmlLista;
        } else {
            infoStatus.innerHTML = `⚠️ <strong>Nenhum time salvo encontrado.</strong> Vá na tela de <a href="sorteio.html" class="link-interno">Sorteio</a>, monte e salve seus times primeiro!`;
        }
    }

    function carregarPartidasSalvas() {
        const salvas = localStorage.getItem('partidas_geradas');
        if (salvas) {
            try {
                const parsed = JSON.parse(salvas);
                if (Array.isArray(parsed)) {
                    partidas = parsed;
                    recalcularContadoresMemoria();
                    atualizarPainelTimesStatus();
                    renderizarTabela();
                }
            } catch(e) {}
        } else {
            partidas = [];
            renderizarTabela();
        }
    }

    function salvarPartidasMemoria() {
        localStorage.setItem('partidas_geradas', JSON.stringify(partidas));
    }

    function atualizarHistoricoRanking() {
        let historicoVitorias = {};
        partidas.forEach(p => {
            if (p.vencedor) historicoVitorias[p.vencedor] = (historicoVitorias[p.vencedor] || 0) + 1;
        });
        localStorage.setItem('ranking_historico', JSON.stringify(historicoVitorias));
    }

    const btnGerarLista = document.getElementById('btnGerarLista');
    if(btnGerarLista) {
        btnGerarLista.addEventListener('click', () => {
            if (timesDisponiveis.length < 2) {
                alert("Você precisa ter pelo menos 2 times salvos na tela de Sorteio para gerar as partidas!");
                return;
            }
            document.getElementById('modalPartidas').innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-card">
                        <div class="modal-icone-status">⚠️</div>
                        <div class="modal-titulo">Atenção</div>
                        <div class="modal-texto">Gerar novas partidas vai zerar o histórico do Ranking, deseja gerar uma nova partida?</div>
                        <div class="modal-botoes">
                            <button class="modal-btn modal-btn-cancelar" type="button" onclick="fecharModalPartidas()">Cancelar</button>
                            <button class="modal-btn modal-btn-confirmar" type="button" style="background-color: #dc3545;" onclick="executarGeracaoPartidas()">Gerar</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }


    window.fecharModalPartidas = function() {
        document.getElementById('modalPartidas').innerHTML = '';
    };

    window.executarGeracaoPartidas = function() {
        fecharModalPartidas();
        localStorage.removeItem('ranking_historico');
        const horas = parseInt(document.getElementById('selectHoras').value) || 2;
        const numTimes = timesDisponiveis.length;
        const partidasBaseAlvo = horas * 12;
        let jogosPorTime = Math.round((partidasBaseAlvo * 2) / numTimes);
        if (jogosPorTime < 1) jogosPorTime = 1;
        const totalPartidas = Math.round((jogosPorTime * numTimes) / 2);

        contadorPartidasTimes = {};
        timesDisponiveis.forEach(t => contadorPartidasTimes[t] = 0);
        partidas = [];
        let idContador = 1;

        for (let i = 0; i < totalPartidas; i++) {
            let timesOrdenados = [...timesDisponiveis].sort((a, b) => {
                if (contadorPartidasTimes[a] !== contadorPartidasTimes[b]) return contadorPartidasTimes[a] - contadorPartidasTimes[b];
                return Math.random() - 0.5;
            });
            let t1 = timesOrdenados[0];
            let t2 = timesOrdenados[1];
            if (numTimes > 2 && i > 0) {
                let ultimaPartida = partidas[i - 1];
                if ((ultimaPartida.time1 === t1 && ultimaPartida.time2 === t2) || (ultimaPartida.time1 === t2 && ultimaPartida.time2 === t1)) {
                    if (timesOrdenados[2]) t2 = timesOrdenados[2];
                }
            }
            contadorPartidasTimes[t1]++;
            contadorPartidasTimes[t2]++;
            partidas.push({ id: idContador++, time1: t1, time2: t2, vencedor: null, status: i === 0 ? 'ativa' : 'bloqueada' });
        }
        salvarPartidasMemoria();
        atualizarHistoricoRanking();
        atualizarPainelTimesStatus();
        renderizarTabela();
    };

    window.adicionarPartidaManual = function() {
        if (timesDisponiveis.length < 2) {
            alert("Você precisa ter times disponíveis para adicionar partidas!");
            return;
        }
        const novoId = partidas.length > 0 ? partidas[partidas.length - 1].id + 1 : 1;
        let timesOrdenados = [...timesDisponiveis].sort((a, b) => (contadorPartidasTimes[a] || 0) - (contadorPartidasTimes[b] || 0));
        const t1 = timesOrdenados[0];
        const t2 = timesOrdenados[1] || timesOrdenados[0];
        contadorPartidasTimes[t1] = (contadorPartidasTimes[t1] || 0) + 1;
        contadorPartidasTimes[t2] = (contadorPartidasTimes[t2] || 0) + 1;
        const deveSerAtiva = partidas.length === 0 || !partidas.some(p => p.status === 'ativa');
        partidas.push({ id: novoId, time1: t1, time2: t2, vencedor: null, status: deveSerAtiva ? 'ativa' : 'bloqueada' });
        salvarPartidasMemoria();
        atualizarHistoricoRanking();
        atualizarPainelTimesStatus();
        renderizarTabela();
    };

    function renderizarTabela() {
        const corpo = document.getElementById('listaPartidasCorpo');
        if(!corpo) return;
        corpo.innerHTML = '';
        if (partidas.length === 0) {
            corpo.innerHTML = '<div class="aviso-vazio">Nenhuma partida gerada no momento.</div>';
            return;
        }
        partidas.forEach((p) => {
            const linha = document.createElement('div');
            linha.className = `partida-linha ${p.status}`;
            linha.id = `linha-partida-${p.id}`;
            let conteudoVencedor = '';
            if (p.vencedor) {
                conteudoVencedor = `<span class="badge-vencedor">🏆 ${p.vencedor}</span>`;
            } else if (p.status === 'ativa') {
                conteudoVencedor = `
                    <div class="vencedor-controles">
                        <select class="select-vencedor" id="select-${p.id}">
                            <option value="${p.time1}">${p.time1}</option>
                            <option value="${p.time2}">${p.time2}</option>
                        </select>
                        <button class="btn-ok" type="button" onclick="confirmarVencedor(${p.id})">OK</button>
                    </div>
                `;
            } else {
                conteudoVencedor = `
                    <div class="vencedor-controles">
                        <select class="select-vencedor" disabled><option>Aguardando...</option></select>
                        <button class="btn-ok" type="button" disabled>OK</button>
                    </div>
                `;
            }
            linha.innerHTML = `
                <div class="col-partida">
                    <div class="partida-info-texto">
                        <span class="partida-numero">Partida ${p.id}</span>
                        <span>${p.time1} <strong>vs</strong> ${p.time2}</span>
                    </div>
                </div>
                <div class="col-vencedor">${conteudoVencedor}</div>
            `;
            corpo.appendChild(linha);
        });
    }

    window.confirmarVencedor = function(id) {
        const select = document.getElementById(`select-${id}`);
        const vencedorEscolhido = select.value;
        let partidaAtual = partidas.find(p => p.id === id);
        if (partidaAtual) {
            partidaAtual.vencedor = vencedorEscolhido;
            partidaAtual.status = 'concluida';
        }
        let proximaPartida = partidas.find(p => p.id === id + 1);
        if (proximaPartida) proximaPartida.status = 'ativa';
        salvarPartidasMemoria();
        atualizarHistoricoRanking();
        renderizarTabela();
        setTimeout(() => {
            const proximaLinha = document.getElementById(`linha-partida-${id + 1}`);
            if (proximaLinha) proximaLinha.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    atualizarPaginaPartidas();
});