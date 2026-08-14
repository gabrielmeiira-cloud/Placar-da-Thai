window.addEventListener('DOMContentLoaded', () => {
    let timesSalvosRanking = [];
    let trofeusTimes = {};

    function formatarTrofeus(qtd) {
        if (qtd <= 0) return '—';
        let linhas = [];
        for (let i = 0; i < qtd; i += 5) {
            linhas.push('🏆'.repeat(Math.min(5, qtd - i)));
        }
        return linhas.join('<br>');
    }

    function carregarDadosRanking() {
        const secaoPodio = document.getElementById('secaoPodio');
        if(!secaoPodio) return;

        const dadosTimes = localStorage.getItem('times_salvos');
        const dadosHistorico = localStorage.getItem('ranking_historico');
        const dadosTrofeusManuais = localStorage.getItem('ranking_trofeus');
        trofeusTimes = {};
        timesSalvosRanking = [];

        if (dadosTimes && dadosTimes.trim() !== "" && dadosTimes !== "[]") {
            try { timesSalvosRanking = JSON.parse(dadosTimes); } catch(e) { timesSalvosRanking = []; }
        }

        if (dadosHistorico && timesSalvosRanking.length > 0) {
            try {
                const historico = JSON.parse(dadosHistorico);
                timesSalvosRanking.forEach((timeJogadores, index) => {
                    const nomes = timeJogadores.map(j => j.nome).join(' & ');
                    const nomeFormatado = `Time ${index + 1} (${nomes})`;
                    if (historico[nomeFormatado] !== undefined) trofeusTimes[index] = historico[nomeFormatado];
                    else if (historico[`Time ${index + 1}`] !== undefined) trofeusTimes[index] = historico[`Time ${index + 1}`];
                    else {
                        for (let chave in historico) {
                            if (chave.includes(`Time ${index + 1}`)) {
                                trofeusTimes[index] = historico[chave];
                                break;
                            }
                        }
                    }
                });
            } catch(e) {}
        } else if (dadosTrofeusManuais) {
            try { trofeusTimes = JSON.parse(dadosTrofeusManuais); } catch(e) { trofeusTimes = {}; }
        }

        if (timesSalvosRanking.length === 0) {
            document.getElementById('secaoPodio').style.display = 'none';
            document.getElementById('secaoRankingCompleto').style.display = 'none';
            document.getElementById('secaoSemTimes').style.display = 'block';
        } else {
            document.getElementById('secaoPodio').style.display = 'block';
            document.getElementById('secaoRankingCompleto').style.display = 'block';
            document.getElementById('secaoSemTimes').style.display = 'none';
            renderizarInterfaceRanking();
        }
    }

    function obterListaClassificada() {
        return timesSalvosRanking.map((time, index) => ({
            indice: index,
            nomeTime: `Time ${index + 1}`,
            membros: `(${time.map(j => j.nome).join(', ')})`,
            trofeus: trofeusTimes[index] || 0
        })).sort((a, b) => b.trofeus - a.trofeus);
    }

    function renderizarInterfaceRanking() {
        const ranking = obterListaClassificada();
        const containerPodio = document.getElementById('containerPodio');
        if(!containerPodio) return;

        let p1 = ranking[0] || { nomeTime: '-', membros: '(-)', trofeus: 0 };
        let p2 = ranking[1] || { nomeTime: '-', membros: '(-)', trofeus: 0 };
        let p3 = ranking[2] || { nomeTime: '-', membros: '(-)', trofeus: 0 };

        containerPodio.innerHTML = `
            <div class="podio-coluna">
                <div class="podio-info-topo">
                    <span class="podio-avatar" title="${p2.nomeTime}">${p2.nomeTime}</span>
                    <span class="podio-membros" title="${p2.membros}">${p2.membros}</span>
                </div>
                <div class="podio-bloco podio-2">
                    <span class="podio-posicao-num">2º</span>
                    <div class="podio-trofeus">${formatarTrofeus(p2.trofeus)}</div>
                </div>
            </div>
            <div class="podio-coluna">
                <div class="podio-info-topo">
                    <span class="podio-avatar" title="${p1.nomeTime}">${p1.nomeTime}</span>
                    <span class="podio-membros" title="${p1.membros}">${p1.membros}</span>
                </div>
                <div class="podio-bloco podio-1">
                    <span class="podio-posicao-num">1º</span>
                    <div class="podio-trofeus">${formatarTrofeus(p1.trofeus)}</div>
                </div>
            </div>
            <div class="podio-coluna">
                <div class="podio-info-topo">
                    <span class="podio-avatar" title="${p3.nomeTime}">${p3.nomeTime}</span>
                    <span class="podio-membros" title="${p3.membros}">${p3.membros}</span>
                </div>
                <div class="podio-bloco podio-3">
                    <span class="podio-posicao-num">3º</span>
                    <div class="podio-trofeus">${formatarTrofeus(p3.trofeus)}</div>
                </div>
            </div>
        `;

        const listaCompleta = document.getElementById('listaRankingCompleta');
        listaCompleta.innerHTML = '';
        ranking.forEach((t, i) => {
            let classeCard = 'ranking-card';
            if (i === 0) classeCard += ' lider';
            else if (i === 1) classeCard += ' vice';
            else if (i === 2) classeCard += ' terceiro';
            listaCompleta.innerHTML += `
                <div class="${classeCard}">
                    <div class="ranking-info">
                        <span class="ranking-pos">${i + 1}º</span>
                        <div>
                            <div class="ranking-nome-time">${t.nomeTime}</div>
                            <div style="font-size: 0.8rem; color: #aaa; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.membros}</div>
                        </div>
                    </div>
                    <div class="ranking-qtd-trofeus">${formatarTrofeus(t.trofeus)}</div>
                </div>
            `;
        });
    }

    carregarDadosRanking();
});