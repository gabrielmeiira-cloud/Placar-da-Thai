window.addEventListener('DOMContentLoaded', () => {
    let baseJogadores = [];
    let jogadoresSelecionados = new Set();
    let timesAtuais = [];
    let filaEspera = [];
    let modoVisualizacao = 'sorteio';
    let timeSelecionadoManual = 0;
    const svgM14 = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="icone-m"><circle cx="10" cy="14" r="6"></circle><line x1="14.24" y1="9.76" x2="20" y2="4"></line><polyline points="15 4 20 4 20 9"></polyline></svg>`;
    const svgF14 = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="icone-f"><circle cx="12" cy="9" r="6"></circle><line x1="12" y1="15" x2="12" y2="22"></line><line x1="9" y1="19" x2="15" y2="19"></line></svg>`;

    function carregarJogadoresSorteio() {
        const dados = localStorage.getItem('base_jogadores');
        const grade = document.getElementById('gradeJogadores');
        if(!grade) return;
        baseJogadores = dados ? JSON.parse(dados) : [];
        jogadoresSelecionados = new Set();

        if (baseJogadores.length > 0) {
            grade.innerHTML = '';
            baseJogadores.forEach((j, index) => {
                const card = document.createElement('div');
                card.className = 'card-selecao';
                card.id = `card-${index}`;
                card.onclick = () => alternarSelecao(index);
                card.innerHTML = `
                    <div class="card-topo">
                        <span class="j-nome-icone">${j.genero === 'm' ? svgM14 : svgF14} <span class="card-nome">${j.nome}</span></span>
                    </div>
                    <div class="card-estrelas">${'⭐'.repeat(j.nivel)}</div>
                `;
                grade.appendChild(card);
            });
        } else {
            grade.innerHTML = '<span style="color: #777; font-size: 0.85rem; text-align: center; width: 100%; padding: 10px;">Nenhum jogador cadastrado. Vá em "Jogadores" primeiro.</span>';
        }
        atualizarContador();
        carregarTimesIniciaisSalvos();
    }

    function carregarTimesIniciaisSalvos() {
        const salvos = localStorage.getItem('times_salvos');
        if (salvos && salvos.trim() !== "" && salvos !== "[]") {
            try {
                const parsed = JSON.parse(salvos);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    timesAtuais = parsed;
                    modoVisualizacao = 'sorteio';
                    timeSelecionadoManual = 0;
                    renderizarVisualizacao();
                }
            } catch(e) {}
        }
    }

    function alternarSelecao(index) {
        const card = document.getElementById(`card-${index}`);
        if (jogadoresSelecionados.has(index)) {
            jogadoresSelecionados.delete(index);
            card.classList.remove('selecionado');
        } else {
            jogadoresSelecionados.add(index);
            card.classList.add('selecionado');
        }
        atualizarContador();
    }

    window.selecionarTodos = function(selecionar) {
        baseJogadores.forEach((_, index) => {
            const card = document.getElementById(`card-${index}`);
            if (!card) return;
            if (selecionar) {
                jogadoresSelecionados.add(index);
                card.classList.add('selecionado');
            } else {
                jogadoresSelecionados.delete(index);
                card.classList.remove('selecionado');
            }
        });
        atualizarContador();
    }

    function atualizarContador() {
        const contador = document.getElementById('contadorSelecionados');
        if(contador) {
            contador.innerText = `${jogadoresSelecionados.size} / ${baseJogadores.length}`;
        }
    }

    function embaralhar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    document.querySelectorAll('input[name="modo"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const btn = document.getElementById('btnAcao');
            if (e.target.value === 'manual') {
                btn.innerHTML = 'Iniciar Montagem Manual';
                btn.style.backgroundColor = '#ffc107';
                btn.style.color = '#111';
            } else if (e.target.value === 'misto') {
                btn.innerHTML = '🎲 Sortear Times (Equilibrado/Justo)';
                btn.style.backgroundColor = '#28a745';
                btn.style.color = 'white';
            } else {
                btn.innerHTML = '🎲 Sortear Times';
                btn.style.backgroundColor = '#28a745';
                btn.style.color = 'white';
            }
        });
    });


    window.iniciarGeracao = function() {
        if (jogadoresSelecionados.size === 0) {
            alert("Selecione pelo menos um jogador!");
            return;
        }
        const tamanhoTime = parseInt(document.querySelector('input[name="tamanho"]:checked').value);
        const modo = document.querySelector('input[name="modo"]:checked').value;
        let presentes = Array.from(jogadoresSelecionados).map(i => ({...baseJogadores[i], idOriginal: i}));
        const qtdTimesCompletos = Math.floor(presentes.length / tamanhoTime);
        if (qtdTimesCompletos === 0 && modo !== 'manual') {
            alert(`Você selecionou ${presentes.length} pessoas. Insuficiente para formar 1 time de ${tamanhoTime}.`);
            return;
        }
        let qtdTimesIniciais = qtdTimesCompletos > 0 ? qtdTimesCompletos : 1;
        if (modo === 'manual') prepararModoManual(presentes, qtdTimesIniciais);
        else gerarSorteioAleatorioEquilibrado(presentes, tamanhoTime, qtdTimesCompletos, modo);
    }

    function gerarSorteioAleatorioEquilibrado(presentes, tamanhoTime, qtdTimesCompletos, modo) {
        modoVisualizacao = 'sorteio';
        timeSelecionadoManual = 0;
        timesAtuais = Array.from({length: qtdTimesCompletos}, () => []);
        filaEspera = [];

        const prepararLista = (lista) => {
            let grupos = {};
            lista.forEach(j => {
                if (!grupos[j.nivel]) grupos[j.nivel] = [];
                grupos[j.nivel].push(j);
            });
            let listaFinal = [];
            Object.keys(grupos).map(Number).sort((a, b) => b - a).forEach(nivel => {
                listaFinal.push(...embaralhar([...grupos[nivel]]));
            });
            return listaFinal;
        };

        let totalVagas = qtdTimesCompletos * tamanhoTime;

        if (modo === 'normal') {
            let listaOrdenada = prepararLista(presentes);
            let direcao = 1, indexTime = 0;
            for (let i = 0; i < totalVagas; i++) {
                timesAtuais[indexTime].push(listaOrdenada[i]);
                indexTime += direcao;
                if (indexTime >= qtdTimesCompletos || indexTime < 0) {
                    direcao *= -1;
                    indexTime += direcao;
                }
            }
            for (let i = totalVagas; i < listaOrdenada.length; i++) filaEspera.push(listaOrdenada[i]);
            timesAtuais.forEach(time => embaralhar(time));
        } else if (modo === 'misto') {
            let listaGeral = prepararLista(presentes);
            let jogadoresAtivos = listaGeral.slice(0, totalVagas);
            filaEspera = listaGeral.slice(totalVagas);
            let mulheres = jogadoresAtivos.filter(j => j.genero === 'f');
            let homens = jogadoresAtivos.filter(j => j.genero === 'm');
            let baseW = Math.floor(mulheres.length / qtdTimesCompletos);
            let extraW = mulheres.length % qtdTimesCompletos;
            let timesTemp = Array.from({length: qtdTimesCompletos}, (_, i) => ({
                id: i, jogadores: [], estrelas: 0,
                vagasM: baseW + (i < extraW ? 1 : 0),
                vagasTotais: tamanhoTime
            }));
            let mIndex = 0;
            timesTemp.forEach(t => {
                for (let i = 0; i < t.vagasM; i++) {
                    if (mIndex < mulheres.length) {
                        let m = mulheres[mIndex++];
                        t.jogadores.push(m);
                        t.estrelas += m.nivel;
                    }
                }
            });
            homens.forEach(h => {
                let timesComVaga = timesTemp.filter(t => t.jogadores.length < t.vagasTotais);
                timesComVaga.sort((a, b) => a.estrelas - b.estrelas);
                if (timesComVaga.length > 0) {
                    timesComVaga[0].jogadores.push(h);
                    timesComVaga[0].estrelas += h.nivel;
                }
            });
            timesTemp.forEach(t => { timesAtuais[t.id] = embaralhar(t.jogadores); });
        }
        verificarExistenciaTimesSalvosESortear();
    }

    window.adicionarTimeManual = function() {
        timesAtuais.push([]);
        timeSelecionadoManual = timesAtuais.length - 1;
        renderizarVisualizacao();
    }

    function removerTimeManual(index, event) {
        event.stopPropagation();
        if (timesAtuais[index].length > 0) {
            filaEspera.push(...timesAtuais[index]);
            filaEspera.sort((a, b) => b.nivel - a.nivel);
        }
        timesAtuais.splice(index, 1);
        if (timeSelecionadoManual === index) timeSelecionadoManual = Math.max(0, timesAtuais.length - 1);
        else if (timeSelecionadoManual > index) timeSelecionadoManual--;
        renderizarVisualizacao();
    }

    function prepararModoManual(presentes, qtdTimesIniciais) {
        modoVisualizacao = 'manual';
        timeSelecionadoManual = 0;
        timesAtuais = Array.from({length: qtdTimesIniciais}, () => []);
        filaEspera = embaralhar([...presentes]).sort((a, b) => b.nivel - a.nivel);
        verificarExistenciaTimesSalvosESortear();
    }

    function verificarExistenciaTimesSalvosESortear() {
        const salvos = localStorage.getItem('times_salvos');
        const modalContainer = document.getElementById('modalSorteio');
        if (salvos && salvos.trim() !== "" && salvos !== "[]") {
            modalContainer.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-card">
                        <div class="modal-icone-status">❌</div>
                        <div class="modal-titulo">Times Salvos Encontrados</div>
                        <div class="modal-texto">Já existem times salvos cadastrados no sistema. Deseja sobrescrevê-los com este novo sorteio?</div>
                        <div class="modal-botoes">
                            <button class="modal-btn modal-btn-cancelar" type="button" onclick="fecharModalSorteio()">Manter Antigos</button>
                            <button class="modal-btn modal-btn-confirmar" type="button" onclick="fecharModalSorteio(); renderizarVisualizacao();">Sobrescrever</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            renderizarVisualizacao();
        }
    }

    window.fecharModalSorteio = function() {
        document.getElementById('modalSorteio').innerHTML = '';
    }

    window.salvarTimesDefinitivo = function() {
        if (timesAtuais.length === 0 || timesAtuais.every(t => t.length === 0)) {
            alert("Os times estão vazios. Monte ou sorteie os times antes de salvar!");
            return;
        }
        localStorage.setItem('times_salvos', JSON.stringify(timesAtuais));
        document.getElementById('modalSorteio').innerHTML = `
            <div class="modal-overlay">
                <div class="modal-card">
                    <div class="modal-icone-status">✅</div>
                    <div class="modal-titulo">Sucesso!</div>
                    <div class="modal-texto">Os times foram salvos com sucesso e já podem ser puxados pelas páginas de partidas e ranking!</div>
                    <div class="modal-botoes">
                        <button class="modal-btn modal-btn-confirmar" type="button" onclick="fecharModalSorteio()">OK</button>
                    </div>
                </div>
            `;
    }

    window.confirmarExcluirTodos = function() {
        document.getElementById('modalSorteio').innerHTML = `
            <div class="modal-overlay">
                <div class="modal-card">
                    <div class="modal-icone-status">⚠️</div>
                    <div class="modal-titulo">Excluir Todos os Times</div>
                    <div class="modal-texto">Tem certeza que deseja apagar todos os times atuais e salvos?</div>
                    <div class="modal-botoes">
                        <button class="modal-btn modal-btn-cancelar" type="button" onclick="fecharModalSorteio()">Cancelar</button>
                        <button class="modal-btn modal-btn-confirmar" type="button" style="background-color: #dc3545;" onclick="excluirTodosDefinitivo()">Excluir</button>
                    </div>
                </div>
            `;
    }

    function excluirTodosDefinitivo() {
        localStorage.removeItem('times_salvos');
        timesAtuais = [];
        filaEspera = [];
        fecharModalSorteio();
        document.getElementById('secaoResultados').style.display = 'none';
    }

    function selecionarTimeManual(index) {
        timeSelecionadoManual = index;
        renderizarVisualizacao();
    }

    function adicionarAoTimeAtivo(indexFila) {
        if (timesAtuais.length === 0) {
            alert("Crie um time primeiro clicando em 'Adicionar Novo Time'!");
            return;
        }
        const jogador = filaEspera.splice(indexFila, 1)[0];
        timesAtuais[timeSelecionadoManual].push(jogador);
        renderizarVisualizacao();
    }

    function removerDoTime(indexTime, indexJogador) {
        const jogador = timesAtuais[indexTime].splice(indexJogador, 1)[0];
        filaEspera.push(jogador);
        filaEspera.sort((a, b) => b.nivel - a.nivel);
        renderizarVisualizacao();
    }

    function renderizarVisualizacao() {
        const container = document.getElementById('containerTimes');
        if(!container) return;
        const banco = document.getElementById('bancoManual');
        const instrucao = document.getElementById('instrucaoManual');
        const secao = document.getElementById('secaoResultados');
        const titulo = document.getElementById('tituloResultados');
        const acoesExtras = document.getElementById('acoesManuaisExtra');

        container.innerHTML = '';
        const mostrarBanco = filaEspera.length > 0 || modoVisualizacao === 'manual';

        if (mostrarBanco) {
            instrucao.style.display = 'block';
            banco.style.display = 'flex';
            banco.innerHTML = '<div style="width: 100%; font-size: 0.8rem; color:#bbb;">Banco de Reservas / Disponíveis:</div>';
            if (filaEspera.length === 0) banco.innerHTML += '<span style="color:#666; font-size:0.85rem;">Nenhum jogador no banco.</span>';
            filaEspera.forEach((j, i) => {
                banco.innerHTML += `
                    <div class="chip-jogador" onclick="adicionarAoTimeAtivo(${i})">
                        ${j.genero === 'm' ? svgM14 : svgF14} ${j.nome} <span style="color:#ffc107">${'⭐'.repeat(j.nivel)}</span>
                    </div>
                `;
            });
        } else {
            instrucao.style.display = 'none';
            banco.style.display = 'none';
        }

        titulo.innerText = modoVisualizacao === 'manual' ? 'Montagem Manual' : 'Times Gerados';
        acoesExtras.style.display = 'block';

        timesAtuais.forEach((time, indice) => {
            let estrelasTotais = time.reduce((soma, j) => soma + j.nivel, 0);
            let classesCard = 'time-card interativo' + (indice === timeSelecionadoManual ? ' ativo' : '');
            let htmlTime = `
                <div class="${classesCard}" onclick="selecionarTimeManual(${indice})">
                    <div class="time-header">
                        <span style="display: flex; align-items: center;">Time ${indice + 1} (${time.length}) <span onclick="removerTimeManual(${indice}, event)" style="padding-left: 10px; cursor: pointer;" title="Excluir Time">🗑️</span></span>
                        <span class="time-forca">⭐ Força: ${estrelasTotais}</span>
                    </div>
                    <div class="time-lista">
            `;
            if (time.length === 0) {
                htmlTime += '<span style="color: #666; font-size: 0.85rem; text-align: center;">Time vazio... (toque para selecionar e adicione jogadores do banco)</span>';
            }
            time.forEach((j, idxJogador) => {
                htmlTime += `
                    <div class="jogador-item-lista clicavel" onclick="removerDoTime(${indice}, ${idxJogador}); event.stopPropagation();">
                        <span class="j-nome-icone">${j.genero === 'm' ? svgM14 : svgF14} ${j.nome}</span>
                        <span style="color: #ffc107; font-size: 0.8rem;">${'⭐'.repeat(j.nivel)}</span>
                    </div>
                `;
            });
            htmlTime += '</div></div>';
            container.innerHTML += htmlTime;
        });
        secao.style.display = 'block';
    }

    carregarJogadoresSorteio();
});