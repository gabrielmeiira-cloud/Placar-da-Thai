/**
 * PLACAR DA THAI V2.0 - SCRIPT UNIFICADO (TEMA VIDRO + ONE-PAGE SCROLLSPY)
 */
(function () {
    'use strict';

    // 1. STATE MANAGEMENT
    const State = {
        KEYS: {
            JOGADORES: 'base_jogadores',
            TIMES: 'times_salvos',
            PARTIDAS: 'partidas_geradas',
            PARTIDA_ATUAL: 'thai_partida_ativa',
            CONFIGS: 'thai_configs'
        },
        data: {
            jogadores: [],
            times: [],
            partidas: [],
            partidaAtual: null,
            configs: {
                tema: 'claro',
                figurinhas: false,
                ladosInvertidos: false,
                controlesEscondidos: false
            }
        },
        listeners: [],
        init() { this.carregar(); },
        subscribe(fn) { this.listeners.push(fn); },
        notify(tipo, payload) {
            this.listeners.forEach(fn => { try { fn(tipo, payload); } catch (e) { console.error(e); } });
        },
        carregar() {
            try {
                const j = localStorage.getItem(this.KEYS.JOGADORES);
                this.data.jogadores = j ? JSON.parse(j) : [];
                const t = localStorage.getItem(this.KEYS.TIMES);
                this.data.times = t ? JSON.parse(t) : [];
                const p = localStorage.getItem(this.KEYS.PARTIDAS);
                this.data.partidas = p ? JSON.parse(p) : [];
                const pa = localStorage.getItem(this.KEYS.PARTIDA_ATUAL);
                this.data.partidaAtual = pa ? JSON.parse(pa) : null;

                const timesValidos = (this.data.times || []).filter(t => Array.isArray(t) && t.length > 0);
                const temJogadores = this.data.jogadores && this.data.jogadores.length >= 2;
                const temTimes = timesValidos.length >= 2;
                const temPartidas = this.data.partidas && this.data.partidas.length > 0;

                if (!temJogadores || !temTimes || !temPartidas) {
                    this.data.partidaAtual = null;
                    localStorage.removeItem(this.KEYS.PARTIDA_ATUAL);
                    if (!temJogadores || !temTimes) {
                        this.data.partidas = [];
                        localStorage.removeItem(this.KEYS.PARTIDAS);
                    }
                } else if (this.data.partidaAtual && this.data.partidaAtual.idPartida) {
                    const existe = this.data.partidas.some(part => part.id === this.data.partidaAtual.idPartida);
                    if (!existe) {
                        const proxAtiva = this.data.partidas.find(part => part.status === 'ativa');
                        if (proxAtiva) {
                            this.data.partidaAtual = { idPartida: proxAtiva.id, nomeAzul: proxAtiva.time1, nomeVermelho: proxAtiva.time2 };
                            localStorage.setItem(this.KEYS.PARTIDA_ATUAL, JSON.stringify(this.data.partidaAtual));
                        } else {
                            this.data.partidaAtual = null;
                            localStorage.removeItem(this.KEYS.PARTIDA_ATUAL);
                        }
                    }
                }

                const modFila = localStorage.getItem('modalidade_fila_auto'); if (modFila) this.data.modalidadeFilaAuto = modFila;
                const fila = localStorage.getItem('fila_times_auto'); if (fila) this.data.filaTimes = JSON.parse(fila);
                const cfg = localStorage.getItem(this.KEYS.CONFIGS);
                if (cfg) {
                    this.data.configs = { ...this.data.configs, ...JSON.parse(cfg) };
                } else {
                    this.data.configs.tema = localStorage.getItem('tema_placar') || 'claro';
                    const valFig = localStorage.getItem('figurinhas_ativas');
                    this.data.configs.figurinhas = valFig === null ? false : (valFig === 'true' || valFig === true);
                    this.data.configs.ladosInvertidos = localStorage.getItem('lados_invertidos') === 'true';
                    this.data.configs.controlesEscondidos = localStorage.getItem('controles_topo_escondidos') === 'true';
                }
            } catch (e) { console.error('Erro ao carregar dados:', e); }
        },
        salvar() {
            try {
                if (this.data.modalidadeFilaAuto) {
                    localStorage.setItem('modalidade_fila_auto', this.data.modalidadeFilaAuto);
                }
                if (this.data.filaTimes) {
                    localStorage.setItem('fila_times_auto', JSON.stringify(this.data.filaTimes));
                }
            } catch (e) { console.error('Erro ao salvar:', e); }
        },
        salvarJogadores(lista) {
            this.data.jogadores = lista;
            localStorage.setItem(this.KEYS.JOGADORES, JSON.stringify(lista));
            if (!lista || lista.length < 2) {
                this.data.partidaAtual = null;
                localStorage.removeItem(this.KEYS.PARTIDA_ATUAL);
                this.salvarTimes([]);
                this.salvarPartidas([]);
                this.notify('partida_ativa', null);
            }
            this.notify('jogadores', lista);
        },
        adicionarJogador(nome, genero, nivel) {
            this.data.jogadores.push({ nome, genero: genero || 'm', nivel: parseInt(nivel) || 3 });
            this.salvarJogadores(this.data.jogadores);
        },
        removerJogador(index) {
            this.data.jogadores.splice(index, 1);
            this.salvarJogadores(this.data.jogadores);
        },
        salvarTimes(times) {
            this.data.times = times;
            localStorage.setItem(this.KEYS.TIMES, JSON.stringify(times));
            const timesValidos = (times || []).filter(t => Array.isArray(t) && t.length > 0);
            if (timesValidos.length < 2) {
                this.data.partidaAtual = null;
                localStorage.removeItem(this.KEYS.PARTIDA_ATUAL);
                this.salvarPartidas([]);
                this.notify('partida_ativa', null);
            }
            this.notify('times', times);
        },
        salvarPartidas(partidas) {
            this.data.partidas = partidas;
            localStorage.setItem(this.KEYS.PARTIDAS, JSON.stringify(partidas));
            if (!partidas || partidas.length === 0) {
                this.data.partidaAtual = null;
                localStorage.removeItem(this.KEYS.PARTIDA_ATUAL);
                this.notify('partida_ativa', null);
            } else if (this.data.partidaAtual && this.data.partidaAtual.idPartida) {
                const existe = partidas.some(p => p.id === this.data.partidaAtual.idPartida);
                if (!existe) {
                    const prox = partidas.find(p => p.status === 'ativa');
                    if (prox) {
                        this.carregarPartidaNoPlacar(prox.time1, prox.time2, prox.id);
                    } else {
                        this.data.partidaAtual = null;
                        localStorage.removeItem(this.KEYS.PARTIDA_ATUAL);
                        this.notify('partida_ativa', null);
                    }
                }
            }
            this.notify('partidas', partidas);
        },
        salvarConfigs(parciais) {
            this.data.configs = { ...this.data.configs, ...parciais };
            localStorage.setItem(this.KEYS.CONFIGS, JSON.stringify(this.data.configs));
            if (parciais.tema) localStorage.setItem('tema_placar', parciais.tema);
            if (parciais.figurinhas !== undefined) localStorage.setItem('figurinhas_ativas', parciais.figurinhas.toString());
            if (parciais.ladosInvertidos !== undefined) localStorage.setItem('lados_invertidos', parciais.ladosInvertidos.toString());
            if (parciais.controlesEscondidos !== undefined) localStorage.setItem('controles_topo_escondidos', parciais.controlesEscondidos.toString());
            this.notify('configs', this.data.configs);
        },
        carregarPartidaNoPlacar(time1, time2, idPartida = null) {
            this.data.partidaAtual = { idPartida, nomeAzul: time1, nomeVermelho: time2 };
            localStorage.setItem(this.KEYS.PARTIDA_ATUAL, JSON.stringify(this.data.partidaAtual));
            this.notify('partida_ativa', this.data.partidaAtual);
        },
        finalizarPartida(placarAzul, placarVermelho, vencedorLado) {
            const pa = this.data.partidaAtual;
            const nomeVencedor = vencedorLado === 'azul' ? (pa ? pa.nomeAzul : 'Time Azul') : (pa ? pa.nomeVermelho : 'Time Vermelho');
            const itemHist = {
                id: pa && pa.idPartida ? pa.idPartida : (this.data.partidas.length + 1),
                time1: pa ? pa.nomeAzul : 'Time Azul',
                time2: pa ? pa.nomeVermelho : 'Time Vermelho',
                placar1: placarAzul,
                placar2: placarVermelho,
                vencedor: nomeVencedor,
                status: 'concluida'
            };
            let proximaPartida = null;
            if (pa && pa.idPartida) {
                const idx = this.data.partidas.findIndex(p => p.id === pa.idPartida);
                if (idx !== -1) {
                    this.data.partidas[idx].vencedor = nomeVencedor;
                    this.data.partidas[idx].placar1 = placarAzul;
                    this.data.partidas[idx].placar2 = placarVermelho;
                    this.data.partidas[idx].status = 'concluida';
                    if (this.data.partidas[idx + 1]) {
                        this.data.partidas[idx + 1].status = 'ativa';
                        proximaPartida = this.data.partidas[idx + 1];
                    }
                }
            } else {
                this.data.partidas.push(itemHist);
                proximaPartida = this.data.partidas.find(p => p.status === 'ativa');
            }

            // Se estiver explicitamente no modo de filas E não houver próxima partida pré-agendada:
            const isModoFilas = this.data.modoPartidas === 'filas';
            if (isModoFilas && !proximaPartida && this.data.times && this.data.times.length >= 2 && pa) {
                const todosTimesNomes = [];
                this.data.times.forEach((time, index) => {
                    if (Array.isArray(time) && time.length > 0) {
                        todosTimesNomes.push(`Time ${index + 1} (${time.map(j => j.nome).join(' & ')})`);
                    }
                });

                if (todosTimesNomes.length >= 2) {
                    const modalidade = this.data.modalidadeFilaAuto || 'ganha2_descansa1_volta';
                    const perdedor = (pa.nomeAzul === nomeVencedor) ? pa.nomeVermelho : pa.nomeAzul;

                    // Inicializa a fila de espera se não existir
                    if (!this.data.filaTimes || !Array.isArray(this.data.filaTimes)) {
                        this.data.filaTimes = todosTimesNomes.filter(t => t !== nomeVencedor && t !== perdedor);
                    }

                    // Contar vitórias consecutivas do time vencedor no histórico
                    const concluidas = this.data.partidas.filter(p => p.status === 'concluida');
                    let vitoriasSeguidas = 0;
                    for (let i = concluidas.length - 1; i >= 0; i--) {
                        if (concluidas[i].vencedor === nomeVencedor) {
                            vitoriasSeguidas++;
                        } else {
                            break;
                        }
                    }

                    let proxT1 = null, proxT2 = null;
                    if (vitoriasSeguidas >= 2) {
                        // Ganhou 2 seguidas: time vencedor sai da quadra
                        if (modalidade === 'ganha2_descansa1_volta') {
                            this.data.filaTimes = this.data.filaTimes.filter(t => t !== perdedor && t !== nomeVencedor);
                            this.data.filaTimes.push(perdedor);

                            proxT1 = this.data.filaTimes.shift() || perdedor;
                            proxT2 = this.data.filaTimes.shift() || (proxT1 === perdedor ? nomeVencedor : perdedor);

                            // Descansa este 1 jogo e volta na frente da fila
                            this.data.filaTimes.unshift(nomeVencedor);
                        } else {
                            // Ganha duas e vai pro final da fila
                            this.data.filaTimes = this.data.filaTimes.filter(t => t !== perdedor && t !== nomeVencedor);
                            this.data.filaTimes.push(perdedor);
                            this.data.filaTimes.push(nomeVencedor);

                            proxT1 = this.data.filaTimes.shift() || perdedor;
                            proxT2 = this.data.filaTimes.shift() || (proxT1 === perdedor ? nomeVencedor : perdedor);
                        }
                    } else {
                        // Ganhou 1: Vencedor continua na quadra
                        proxT1 = nomeVencedor;
                        this.data.filaTimes = this.data.filaTimes.filter(t => t !== perdedor && t !== nomeVencedor);
                        this.data.filaTimes.push(perdedor);

                        proxT2 = this.data.filaTimes.shift() || perdedor;
                    }

                    if (proxT1 && proxT2) {
                        const novoId = this.data.partidas.length + 1;
                        proximaPartida = {
                            id: novoId,
                            time1: proxT1,
                            time2: proxT2,
                            vencedor: null,
                            status: 'ativa',
                            modalidade
                        };
                        this.data.partidas.push(proximaPartida);
                    }
                }
            }

            this.salvarPartidas(this.data.partidas);
            
            if (proximaPartida) {
                this.carregarPartidaNoPlacar(proximaPartida.time1, proximaPartida.time2, proximaPartida.id);
            } else {
                this.data.partidaAtual = null;
                localStorage.removeItem(this.KEYS.PARTIDA_ATUAL);
                this.notify('partida_ativa', null);
            }
            this.notify('partida_finalizada', itemHist);
            return proximaPartida;
        },
        obterRanking() {
            let stats = {};
            this.data.times.forEach((time, idx) => {
                const membros = time.map(j => j.nome).join(' & ');
                const chave = `Time ${idx + 1} (${membros})`;
                stats[chave] = { nomeTime: `Time ${idx + 1}`, membros, jogos: 0, vitorias: 0, derrotas: 0, pontosFeitos: 0, pontosSofridos: 0, saldoPontos: 0 };
            });
            this.data.partidas.forEach(p => {
                if (p.vencedor) {
                    [p.time1, p.time2].forEach(t => {
                        if (!stats[t]) {
                            stats[t] = { nomeTime: t, membros: '', jogos: 0, vitorias: 0, derrotas: 0, pontosFeitos: 0, pontosSofridos: 0, saldoPontos: 0 };
                        }
                    });
                    const t1 = stats[p.time1];
                    const t2 = stats[p.time2];
                    if (t1) {
                        t1.jogos++;
                        if (p.placar1 !== undefined && p.placar2 !== undefined) {
                            t1.pontosFeitos += p.placar1; t1.pontosSofridos += p.placar2; t1.saldoPontos = t1.pontosFeitos - t1.pontosSofridos;
                        }
                        if (p.vencedor === p.time1) t1.vitorias++; else t1.derrotas++;
                    }
                    if (t2) {
                        t2.jogos++;
                        if (p.placar1 !== undefined && p.placar2 !== undefined) {
                            t2.pontosFeitos += p.placar2; t2.pontosSofridos += p.placar1; t2.saldoPontos = t2.pontosFeitos - t2.pontosSofridos;
                        }
                        if (p.vencedor === p.time2) t2.vitorias++; else t2.derrotas++;
                    }
                }
            });
            return Object.values(stats).sort((a, b) => {
                if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
                if (b.saldoPontos !== a.saldoPontos) return b.saldoPontos - a.saldoPontos;
                return a.jogos - b.jogos;
            });
        }
    };
    State.init();

    // 2. PAINEL DE GESTÃO EM VIDRO (OVERLAY DRAWER & GUIA DE TÓPICOS SCROLLSPY)
    const OverlayModule = {
        painel: null,
        gatilho: null,
        btnFechar: null,
        conteudo: null,
        botoesAbas: [],
        secoes: [],
        init() {
            this.painel = document.getElementById('painelGestaoOverlay');
            this.gatilho = document.getElementById('btnToggleControlesTopo');
            this.btnFechar = document.getElementById('btnFecharPainel');
            this.conteudo = document.getElementById('painelOverlayConteudo');
            this.botoesAbas = document.querySelectorAll('.painel-abas-nav .btn-aba[data-target]');
            this.secoes = document.querySelectorAll('.secao-painel-item');

            if (this.gatilho) {
                this.gatilho.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggle();
                });
            }

            if (this.btnFechar) {
                this.btnFechar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.fechar();
                });
            }

            this.botoesAbas.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetId = btn.getAttribute('data-target');
                    if (targetId) this.irPara(targetId);
                });
            });

            if (this.conteudo) {
                this.conteudo.addEventListener('scroll', () => {
                    this.atualizarGuiaScrollspy();
                }, { passive: true });
            }

            if (this.painel) {
                this.painel.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
                this.painel.addEventListener('touchend', (e) => { e.stopPropagation(); }, { passive: true });
                this.painel.addEventListener('touchmove', (e) => { e.stopPropagation(); }, { passive: true });
            }

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.estaAberto()) {
                    this.fechar();
                }
            });
        },
        estaAberto() {
            return this.painel && this.painel.classList.contains('aberto');
        },
        abrir(targetId = null) {
            if (this.painel) {
                this.painel.classList.add('aberto');
            }
            document.body.classList.add('painel-aberto');
            if (typeof Placar !== 'undefined') Placar.interagindo = false;
            const barreira = document.getElementById('barreiraTouchPlacar');
            if (barreira) barreira.style.display = 'block';
            const dropdown = document.getElementById('dropdownMenu');
            if (dropdown) dropdown.classList.remove('ativo');
            if (this.gatilho) {
                this.gatilho.setAttribute('title', 'Fechar Configurações');
            }
            if (targetId) {
                setTimeout(() => this.irPara(targetId), 50);
            }
        },
        fechar() {
            if (this.painel) {
                this.painel.classList.remove('aberto');
            }
            document.body.classList.remove('painel-aberto');
            if (typeof Placar !== 'undefined') Placar.interagindo = false;
            const barreira = document.getElementById('barreiraTouchPlacar');
            if (barreira) barreira.style.display = 'none';
            const dropdown = document.getElementById('dropdownMenu');
            if (dropdown) dropdown.classList.remove('ativo');
            if (this.gatilho) {
                this.gatilho.setAttribute('title', 'Configurações e Gestão');
            }
        },
        toggle() {
            if (this.estaAberto()) this.fechar();
            else this.abrir();
        },
        tabAtivaId: null,
        irPara(targetId) {
            const el = document.getElementById(targetId);
            if (el && this.conteudo) {
                const topoRelativo = el.offsetTop - this.conteudo.offsetTop - 15;
                this.conteudo.scrollTo({ top: Math.max(0, topoRelativo), behavior: 'smooth' });
            }
            this.destacarBotaoGuia(targetId);
            if (!this.estaAberto()) this.abrir();
        },
        destacarBotaoGuia(targetId) {
            if (this.tabAtivaId === targetId) return;
            this.tabAtivaId = targetId;

            this.botoesAbas.forEach(b => {
                if (b.getAttribute('data-target') === targetId) {
                    b.classList.add('ativo');
                    b.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                } else {
                    b.classList.remove('ativo');
                }
            });
        },
        atualizarGuiaScrollspy() {
            if (!this.conteudo || !this.secoes || this.secoes.length === 0) return;

            // Se o usuário rolou até o fim da página, destaca a última seção (Ranking)
            const noFim = (this.conteudo.scrollTop + this.conteudo.clientHeight >= this.conteudo.scrollHeight - 40);
            if (noFim) {
                const ultimaSecao = this.secoes[this.secoes.length - 1];
                if (ultimaSecao) {
                    this.destacarBotaoGuia(ultimaSecao.id);
                    return;
                }
            }

            const scrollPos = this.conteudo.scrollTop + 140;
            let idAtual = this.secoes[0].id;

            this.secoes.forEach(secao => {
                const topo = secao.offsetTop - this.conteudo.offsetTop;
                if (scrollPos >= topo) {
                    idAtual = secao.id;
                }
            });

            this.destacarBotaoGuia(idAtual);
        }
    };
    window.OverlayModule = OverlayModule;

    // 3. PLACAR AO VIVO
    const Placar = {
        IMAGENS_DA_THAI: ['Thai01.webp', 'Thai02.webp', 'Thai03.webp'],
        scoreAzul: 0, scoreVermelho: 0, ladosInvertidos: false, jogoEncerrado: false, confetesAtivos: [],
        init() {
            this.cacheDOM();
            this.bindEvents();
            this.aplicarConfigs();
            this.iniciarFisica();
            State.subscribe((tipo) => {
                if (tipo === 'partida_ativa' || tipo === 'times' || tipo === 'partidas' || tipo === 'jogadores') {
                    this.carregarPartidaAtiva();
                }
            });
            this.carregarPartidaAtiva();
        },
        cacheDOM() {
            this.elAzul = document.getElementById('pontosAzul');
            this.elVermelho = document.getElementById('pontosVermelho');
            this.containerAzul = document.getElementById('btnAzul');
            this.containerVermelho = document.getElementById('btnVermelho');
            this.labelAzul = document.getElementById('labelNomeTimeAzul');
            this.labelVermelho = document.getElementById('labelNomeTimeVermelho');
            this.wrapperControles = document.querySelector('.controles-wrapper');
            this.btnInverter = document.getElementById('btnInverterLados');
            this.btnReset = document.getElementById('btnReset');
            this.btnResetBaixo = document.getElementById('btnResetBaixo');
            this.btnFullscreen = document.getElementById('btnFullscreen');
            this.modalZerar = document.getElementById('modalZerarPlacar');
            this.btnCancelarZerar = document.getElementById('btnCancelarZerar');
            this.btnConfirmarZerar = document.getElementById('btnConfirmarZerar');
            this.modalFimJogo = document.getElementById('modalFimJogo');
            this.textoVencedorModal = document.getElementById('textoVencedorModal');
            this.btnSalvarFimJogo = document.getElementById('btnSalvarFimJogo');
            this.btnVoltarPonto = document.getElementById('btnVoltarPonto');
            this.modalRodadaConcluida = document.getElementById('modalRodadaConcluida');
            this.btnIrParaRankingModal = document.getElementById('btnIrParaRankingModal');
            this.btnContinuarPlacarModal = document.getElementById('btnContinuarPlacarModal');
        },
        bindEvents() {
            if (this.containerAzul) this.bindTouchLado(this.containerAzul, 'azul');
            if (this.containerVermelho) this.bindTouchLado(this.containerVermelho, 'vermelho');
            if (this.btnInverter) {
                this.btnInverter.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.ladosInvertidos = !this.ladosInvertidos;
                    State.salvarConfigs({ ladosInvertidos: this.ladosInvertidos });
                    this.aplicarInversao();
                });
            }

            const abrirModalReset = (e) => {
                if (e) e.stopPropagation();
                if (this.scoreAzul > 0 || this.scoreVermelho > 0) {
                    if (this.modalZerar) {
                        this.modalZerar.style.display = 'flex';
                        document.body.classList.add('modal-aberto');
                    }
                } else { this.executarZerar(); }
            };
            if (this.btnReset) this.btnReset.addEventListener('click', abrirModalReset);
            if (this.btnResetBaixo) this.btnResetBaixo.addEventListener('click', abrirModalReset);
            if (this.btnCancelarZerar) {
                this.btnCancelarZerar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.modalZerar) this.modalZerar.style.display = 'none';
                    document.body.classList.remove('modal-aberto');
                });
            }
            if (this.btnConfirmarZerar) {
                this.btnConfirmarZerar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.executarZerar();
                    if (this.modalZerar) this.modalZerar.style.display = 'none';
                    document.body.classList.remove('modal-aberto');
                });
            }
            if (this.btnSalvarFimJogo) {
                this.btnSalvarFimJogo.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const temPartidaAtiva = State.data.partidaAtual && State.data.partidaAtual.idPartida;
                    if (this.modalFimJogo) this.modalFimJogo.style.display = 'none';
                    document.body.classList.remove('modal-aberto');

                    if (temPartidaAtiva) {
                        const prox = State.finalizarPartida(this.scoreAzul, this.scoreVermelho, this.ultimoLadoVencedor);
                        this.executarZerar();
                        if (prox) {
                            this.dispararAviso(`Próximo Jogo: ${prox.time1} vs ${prox.time2}`);
                        } else {
                            if (this.modalRodadaConcluida) {
                                this.modalRodadaConcluida.style.display = 'flex';
                                document.body.classList.add('modal-aberto');
                            } else {
                                this.dispararAviso('Rodada Concluída! 🏆');
                            }
                        }
                    } else {
                        this.executarZerar();
                    }
                });
            }
            if (this.btnIrParaRankingModal) {
                this.btnIrParaRankingModal.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.modalRodadaConcluida) this.modalRodadaConcluida.style.display = 'none';
                    document.body.classList.remove('modal-aberto');
                    OverlayModule.irPara('topico-ranking');
                });
            }
            if (this.btnContinuarPlacarModal) {
                this.btnContinuarPlacarModal.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.modalRodadaConcluida) this.modalRodadaConcluida.style.display = 'none';
                    document.body.classList.remove('modal-aberto');
                });
            }
            if (this.btnVoltarPonto) {
                this.btnVoltarPonto.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.modalFimJogo) this.modalFimJogo.style.display = 'none';
                    document.body.classList.remove('modal-aberto');
                    this.jogoEncerrado = false;
                    if (this.ultimoLadoVencedor === 'azul') {
                        this.scoreAzul = Math.max(0, this.scoreAzul - 1);
                    } else {
                        this.scoreVermelho = Math.max(0, this.scoreVermelho - 1);
                    }
                    this.limparConfetes();
                    this.atualizarPlacar();
                });
            }
            if (this.btnFullscreen) {
                this.btnFullscreen.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(() => {});
                    } else if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                });
            }
        },
        aplicarConfigs() {
            const cfg = State.data.configs;
            this.ladosInvertidos = !!cfg.ladosInvertidos;
            this.aplicarInversao();
        },
        carregarPartidaAtiva() {
            const pa = State.data.partidaAtual;
            const timesValidos = (State.data.times || []).filter(t => Array.isArray(t) && t.length > 0);
            const temJogadores = State.data.jogadores && State.data.jogadores.length >= 2;
            const temTimes = timesValidos.length >= 2;
            const temPartidas = State.data.partidas && State.data.partidas.length > 0;

            if (pa && pa.nomeAzul && pa.nomeVermelho && temJogadores && temTimes && temPartidas) {
                if (this.labelAzul) { this.labelAzul.textContent = pa.nomeAzul; this.labelAzul.style.display = 'block'; }
                if (this.labelVermelho) { this.labelVermelho.textContent = pa.nomeVermelho; this.labelVermelho.style.display = 'block'; }
            } else {
                if (this.labelAzul) { this.labelAzul.textContent = ''; this.labelAzul.style.display = 'none'; }
                if (this.labelVermelho) { this.labelVermelho.textContent = ''; this.labelVermelho.style.display = 'none'; }
                // Quando não há partida ou times válidos, zera a contagem e estado do placar
                this.scoreAzul = 0;
                this.scoreVermelho = 0;
                this.jogoEncerrado = false;
                this.limparConfetes();
                const antiga = document.querySelector('.figurinha-ponto');
                if (antiga) antiga.remove();
            }
            this.atualizarPlacar();
        },
        aplicarInversao() {
            if (this.containerAzul && this.containerVermelho) {
                if (this.ladosInvertidos) {
                    this.containerAzul.style.order = '2';
                    this.containerVermelho.style.order = '1';
                } else {
                    this.containerAzul.style.order = '1';
                    this.containerVermelho.style.order = '2';
                }
            }
        },
        bindTouchLado(container, lado) {
            let startX = 0, startY = 0, interagindo = false, lastTouchTime = 0, lastActionTime = 0;
            const getPos = (e) => {
                if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
                if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
                return { x: e.clientX, y: e.clientY };
            };
            const estaBloqueado = () => {
                if (document.body.classList.contains('painel-aberto') || document.body.classList.contains('modal-aberto')) return true;
                const painel = document.getElementById('painelGestaoOverlay');
                if (painel && (painel.classList.contains('aberto') || (typeof OverlayModule !== 'undefined' && OverlayModule.estaAberto()))) return true;
                const barreira = document.getElementById('barreiraTouchPlacar');
                if (barreira && barreira.style.display !== 'none') return true;
                const dropdown = document.getElementById('dropdownMenu');
                if (dropdown && dropdown.classList.contains('ativo')) return true;
                const modal = document.querySelector('.modal-overlay:not([style*="display: none"])');
                if (modal) return true;
                return false;
            };

            const handleStart = (e) => {
                if (estaBloqueado()) {
                    interagindo = false;
                    return;
                }

                if (e.type === 'mousedown' && Date.now() - lastTouchTime < 600) return;
                if (e.type.startsWith('touch')) lastTouchTime = Date.now();
                if (e.target.closest('.controles-centro, .controles-baixo, .controles-wrapper, .modal-overlay, .painel-gestao-overlay, .dropdown-menu, .bloqueio-touch-menu, button, a, input, select, label, .indicador-rolagem-baixo, .menu-container')) {
                    interagindo = false;
                    return;
                }
                interagindo = true;
                const pos = getPos(e);
                startX = pos.x; startY = pos.y;
            };
            const handleEnd = (e) => {
                if (!interagindo || estaBloqueado()) {
                    interagindo = false;
                    return;
                }

                if (e.type === 'mouseup' && Date.now() - lastTouchTime < 600) return;
                interagindo = false;
                if (e.target.closest('.controles-centro, .controles-baixo, .controles-wrapper, .modal-overlay, .painel-gestao-overlay, .dropdown-menu, .bloqueio-touch-menu, button, a, input, select, label, .indicador-rolagem-baixo, .menu-container')) {
                    return;
                }
                
                const agora = Date.now();
                if (agora - lastActionTime < 180) return;
                lastActionTime = agora;

                const pos = getPos(e);
                let deltaY = pos.y - startY;
                let deltaX = pos.x - startX;
                const isPortrait = window.innerHeight > window.innerWidth;
                const deslizeDiminuir = isPortrait ? (deltaX < -40 || deltaY > 40) : (deltaY > 40);

                if (this.jogoEncerrado) {
                    // Placar travado na vitória. Não permite adicionar nem remover pontos pelo toque.
                    return;
                }
                if (deslizeDiminuir) {
                    if (lado === 'azul') this.scoreAzul = Math.max(0, this.scoreAzul - 1);
                    else this.scoreVermelho = Math.max(0, this.scoreVermelho - 1);
                    this.atualizarPlacar();
                } else {
                    if (lado === 'azul') { if (this.scoreAzul < 15) this.scoreAzul++; }
                    else { if (this.scoreVermelho < 15) this.scoreVermelho++; }
                    this.atualizarPlacar();
                    this.verificarRegras(lado);
                }
            };
            container.addEventListener('touchstart', handleStart, { passive: true });
            container.addEventListener('touchend', handleEnd, { passive: true });
            container.addEventListener('mousedown', handleStart);
            container.addEventListener('mouseup', handleEnd);
        },
        atualizarPlacar() {
            if (this.elAzul) this.elAzul.textContent = this.scoreAzul;
            if (this.elVermelho) this.elVermelho.textContent = this.scoreVermelho;
        },
        verificarRegras(ladoModificado) {
            let diferenca = Math.abs(this.scoreAzul - this.scoreVermelho);
            let maiorPontuacao = Math.max(this.scoreAzul, this.scoreVermelho);
            let venceu = false, ladoVencedor = '';
            if (this.scoreAzul === 15 || this.scoreVermelho === 15) {
                venceu = true; ladoVencedor = this.scoreAzul === 15 ? 'azul' : 'vermelho';
            } else if (maiorPontuacao >= 12 && diferenca >= 2) {
                venceu = true; ladoVencedor = this.scoreAzul > this.scoreVermelho ? 'azul' : 'vermelho';
            }
            if (venceu) {
                this.jogoEncerrado = true;
                this.ultimoLadoVencedor = ladoVencedor;
                this.dispararChuvaConfetes(ladoVencedor);
                let elVencedor = ladoVencedor === 'azul' ? this.elAzul : this.elVermelho;
                elVencedor.innerHTML = '<span class="trofeu-animado">🏆</span>';

                setTimeout(() => {
                    this.atualizarPlacar();
                    this.abrirModalVencedor(ladoVencedor);
                }, 1800);
                return;
            }
            if (this.scoreAzul === this.scoreVermelho && [11, 12, 13, 14].includes(this.scoreAzul) && ladoModificado) {
                this.dispararAviso('Empatou!'); return;
            }
            let matchPoint = false;
            if (this.scoreAzul === 15 || this.scoreVermelho === 15) matchPoint = false;
            else if (this.scoreAzul >= 11 && this.scoreVermelho >= 11 && diferenca === 1) matchPoint = true;
            else if ((this.scoreAzul === 11 && this.scoreVermelho < 11) || (this.scoreVermelho === 11 && this.scoreAzul < 11)) {
                if ((this.scoreAzul === 11 && ladoModificado === 'azul') || (this.scoreVermelho === 11 && ladoModificado === 'vermelho')) matchPoint = true;
            } else if ((this.scoreAzul > 11 || this.scoreVermelho > 11) && diferenca === 1) matchPoint = true;
            if (matchPoint) { this.dispararAviso('MATCH POINT!'); return; }
            if (!this.jogoEncerrado) this.dispararFigurinha(ladoModificado);
        },
        abrirModalVencedor(lado) {
            const pa = State.data.partidaAtual;
            const temPartidaAtiva = pa && pa.idPartida;
            const nome = lado === 'azul' ? (pa && pa.nomeAzul ? pa.nomeAzul : 'Time Azul') : (pa && pa.nomeVermelho ? pa.nomeVermelho : 'Time Vermelho');
            
            if (this.textoVencedorModal) {
                this.textoVencedorModal.innerHTML = `<strong>${nome}</strong> venceu por <strong>${this.scoreAzul} x ${this.scoreVermelho}</strong>!`;
            }

            if (this.btnSalvarFimJogo) {
                if (temPartidaAtiva) {
                    this.btnSalvarFimJogo.innerHTML = '💾 Salvar e Ir para Próxima Partida »»';
                    this.btnSalvarFimJogo.style.backgroundColor = 'var(--cor-verde, #28a745)';
                } else {
                    this.btnSalvarFimJogo.innerHTML = '↺ Zerar Placar';
                    this.btnSalvarFimJogo.style.backgroundColor = '#dc3545';
                }
            }

            if (this.modalFimJogo) {
                this.modalFimJogo.style.display = 'flex';
                document.body.classList.add('modal-aberto');
            }
        },
        executarZerar() {
            this.scoreAzul = 0; this.scoreVermelho = 0; this.jogoEncerrado = false;
            const antiga = document.querySelector('.figurinha-ponto'); if (antiga) antiga.remove();
            this.limparConfetes();
            this.atualizarPlacar();
        },
        dispararAviso(texto) {
            const aviso = document.createElement('div');
            aviso.className = 'aviso-central';
            aviso.textContent = texto;
            document.body.appendChild(aviso);
            setTimeout(() => aviso.remove(), 2000);
        },
        dispararFigurinha(lado) {
            if (!State.data.configs.figurinhas) return;
            const antiga = document.querySelector('.figurinha-ponto'); if (antiga) antiga.remove();
            const container = lado === 'azul' ? this.containerAzul : this.containerVermelho;
            if (!container) return;
            const img = document.createElement('img');
            img.className = 'figurinha-ponto';
            img.src = this.IMAGENS_DA_THAI[Math.floor(Math.random() * this.IMAGENS_DA_THAI.length)];
            container.appendChild(img);
            img.addEventListener('animationend', () => img.remove());
        },
        limparConfetes() {
            this.confetesAtivos.forEach(c => c.el.remove());
            this.confetesAtivos.length = 0;
        },
        dispararChuvaConfetes(lado) {
            this.limparConfetes();
            const container = lado === 'azul' ? this.containerAzul : this.containerVermelho;
            if (!container) return;
            let intervalo = setInterval(() => { for (let i = 0; i < 6; i++) this.criarConfete(container); }, 50);
            setTimeout(() => clearInterval(intervalo), 2000);
        },
        criarConfete(container) {
            const el = document.createElement('div');
            el.className = 'confete';
            const cores = ['#ffeb3b', '#00e676', '#00b0ff', '#ff5722', '#e040fb', '#ffffff'];
            el.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
            el.style.width = (Math.random() * 8 + 8) + 'px';
            el.style.height = (Math.random() * 8 + 8) + 'px';
            if (Math.random() > 0.5) el.style.borderRadius = '50%';
            container.appendChild(el);
            const posX = Math.random() * container.clientWidth;
            this.confetesAtivos.push({
                el, container, x: posX, y: -10,
                vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4 + 2,
                rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.3, vida: 1.0, decay: 0.01
            });
        },
        iniciarFisica() {
            const loop = () => {
                for (let i = this.confetesAtivos.length - 1; i >= 0; i--) {
                    let c = this.confetesAtivos[i];
                    c.vy += c.gravity; c.x += c.vx; c.y += c.vy; c.rot += c.rotSpeed;
                    if (c.y > c.container.clientHeight - 20) { c.vy *= -0.4; c.vx *= 0.8; }
                    c.vida -= c.decay;
                    if (c.vida <= 0) c.el.style.opacity = 0;
                    c.el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`;
                    if (c.vida <= -0.2) { c.el.remove(); this.confetesAtivos.splice(i, 1); }
                }
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        }
    };

    // 4. JOGADORES
    const JogadoresModule = {
        svgM: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="icone-m"><circle cx="10" cy="14" r="6"></circle><line x1="14.24" y1="9.76" x2="20" y2="4"></line><polyline points="15 4 20 4 20 9"></polyline></svg>`,
        svgF: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="icone-f"><circle cx="12" cy="9" r="6"></circle><line x1="12" y1="15" x2="12" y2="22"></line><line x1="9" y1="19" x2="15" y2="19"></line></svg>`,
        init() {
            const btnAdd = document.getElementById('btnAdicionar');
            if (btnAdd) btnAdd.addEventListener('click', () => this.adicionar());
            const inputNome = document.getElementById('inputNome');
            if (inputNome) inputNome.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.adicionar(); });
            State.subscribe((tipo) => { if (tipo === 'jogadores') this.render(); });
            this.render();
        },
        adicionar() {
            const inputNome = document.getElementById('inputNome');
            const nome = inputNome ? inputNome.value.trim() : '';
            const generoEl = document.querySelector('input[name="sexo"]:checked');
            const genero = generoEl ? generoEl.value : 'm';
            const nivelEl = document.getElementById('selectEstrelas');
            const nivel = nivelEl ? parseInt(nivelEl.value) : 3;
            if (!nome) { alert('Por favor, digite o nome do jogador.'); if (inputNome) inputNome.focus(); return; }
            State.adicionarJogador(nome, genero, nivel);
            if (inputNome) { inputNome.value = ''; inputNome.focus(); }
        },
        remover(index) {
            State.removerJogador(index);
            if (State.data.jogadores.length < 2) {
                State.salvarTimes([]);
                State.salvarPartidas([]);
            }
        },
        render() {
            const lista = document.getElementById('listaJogadores');
            const contador = document.getElementById('contadorJogadores');
            if (!lista) return;
            const jogadores = State.data.jogadores;
            if (contador) contador.textContent = jogadores.length;
            if (jogadores.length === 0) {
                lista.innerHTML = '<div class="aviso-vazio">Nenhum jogador cadastrado ainda. Cadastre jogadores acima!</div>';
                return;
            }
            lista.innerHTML = '';
            jogadores.forEach((j, index) => {
                const item = document.createElement('div');
                item.className = 'jogador-item';
                item.innerHTML = `
                    <div class="jogador-info" style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 500;">${j.nome}</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            ${j.genero === 'm' ? this.svgM : this.svgF}
                            <span style="color: #ffc107; font-size: 0.8rem;">${'⭐'.repeat(j.nivel)}</span>
                        </div>
                    </div>
                    <button class="btn-excluir" type="button" onclick="JogadoresModule.remover(${index})">Excluir</button>
                `;
                lista.appendChild(item);
            });
        }
    };

    // 5. SORTEIO DE TIMES
    const SorteioModule = {
        jogadoresSelecionados: new Set(),
        timesAtuais: [],
        filaEspera: [],
        modoVisualizacao: 'sorteio',
        timeSelecionadoManual: 0,
        svgM14: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="icone-m"><circle cx="10" cy="14" r="6"></circle><line x1="14.24" y1="9.76" x2="20" y2="4"></line><polyline points="15 4 20 4 20 9"></polyline></svg>`,
        svgF14: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="icone-f"><circle cx="12" cy="9" r="6"></circle><line x1="12" y1="15" x2="12" y2="22"></line><line x1="9" y1="19" x2="15" y2="19"></line></svg>`,
        init() {
            this.timesAtuais = State.data.times || [];
            
            const alternarVisibilidadeModo = () => {
                const modoPrincipal = document.querySelector('input[name="modoPrincipal"]:checked')?.value || 'manual';
                const tipoSorteio = document.querySelector('input[name="tipoSorteio"]:checked')?.value || 'normal';
                const painelAuto = document.getElementById('opcoesSorteioAuto');
                const btn = document.getElementById('btnAcaoSorteio');

                if (modoPrincipal === 'manual') {
                    if (painelAuto) painelAuto.style.display = 'none';
                    let presentes = Array.from(this.jogadoresSelecionados).map(i => ({ ...State.data.jogadores[i] }));
                    if (this.timesAtuais.length === 0) {
                        this.prepararModoManual(presentes, 2);
                    } else {
                        this.modoVisualizacao = 'manual';
                        this.renderizarVisualizacao();
                    }
                } else {
                    if (painelAuto) painelAuto.style.display = 'flex';
                    const secao = document.getElementById('secaoResultados');
                    if (secao && this.modoVisualizacao === 'manual') {
                        secao.style.display = 'none';
                    }
                    if (btn) {
                        if (tipoSorteio === 'misto') {
                            btn.innerHTML = '👫 Sortear Times (Equilibrado por Sexo)';
                        } else if (tipoSorteio === 'aleatorio') {
                            btn.innerHTML = '🎲 Sortear Times (Aleatório)';
                        } else {
                            btn.innerHTML = '🎲 Sortear Times (Equilibrado por Nível)';
                        }
                    }
                }
            };

            document.querySelectorAll('input[name="modoPrincipal"]').forEach(radio => {
                radio.addEventListener('change', alternarVisibilidadeModo);
            });

            document.querySelectorAll('input[name="tipoSorteio"]').forEach(radio => {
                radio.addEventListener('change', alternarVisibilidadeModo);
            });

            State.subscribe((tipo) => {
                if (tipo === 'jogadores') {
                    this.atualizarVisibilidade();
                    this.carregarGrade();
                }
                if (tipo === 'times') {
                    this.timesAtuais = State.data.times;
                    this.renderizarVisualizacao();
                }
            });
            this.atualizarVisibilidade();
            this.carregarGrade();
            alternarVisibilidadeModo();
            if (this.timesAtuais.length > 0) this.renderizarVisualizacao();
        },
        atualizarVisibilidade() {
            const avisoSemJogadores = document.getElementById('secaoSemJogadores');
            const conteudoSecaoTimes = document.getElementById('conteudoSecaoTimes');
            const temJogadores = State.data.jogadores && State.data.jogadores.length > 0;
            if (avisoSemJogadores) avisoSemJogadores.style.display = temJogadores ? 'none' : 'block';
            if (conteudoSecaoTimes) conteudoSecaoTimes.style.display = temJogadores ? 'flex' : 'none';
        },
        carregarGrade() {
            const grade = document.getElementById('gradeJogadores');
            if (!grade) return;
            const jogadores = State.data.jogadores;
            this.jogadoresSelecionados = new Set();
            if (jogadores.length > 0) {
                grade.innerHTML = '';
                jogadores.forEach((j, index) => {
                    const card = document.createElement('div');
                    card.className = 'card-selecao'; card.id = `card-j-${index}`;
                    card.onclick = () => this.alternarSelecao(index);
                    card.innerHTML = `
                        <div class="card-topo"><span class="j-nome-icone">${j.genero === 'm' ? this.svgM14 : this.svgF14} <span class="card-nome">${j.nome}</span></span></div>
                        <div class="card-estrelas">${'⭐'.repeat(j.nivel)}</div>
                    `;
                    grade.appendChild(card);
                });
            } else {
                grade.innerHTML = '<div class="aviso-vazio">Nenhum jogador cadastrado na seção acima.</div>';
            }
            this.atualizarContador();
        },
        sincronizarSelecaoComBanco(index, selecionou) {
            const jOriginal = State.data.jogadores[index];
            if (!jOriginal) return;
            const modoPrincipal = document.querySelector('input[name="modoPrincipal"]:checked')?.value || 'manual';

            if (selecionou) {
                if (modoPrincipal === 'manual') {
                    if (this.modoVisualizacao !== 'manual') {
                        this.modoVisualizacao = 'manual';
                        if (this.timesAtuais.length === 0) this.timesAtuais = [[], []];
                    }
                    let jaExiste = this.filaEspera.some(j => j.nome === jOriginal.nome) ||
                        this.timesAtuais.some(t => Array.isArray(t) && t.some(j => j.nome === jOriginal.nome));
                    if (!jaExiste) {
                        this.filaEspera.push({ ...jOriginal });
                        this.filaEspera.sort((a, b) => b.nivel - a.nivel);
                    }
                    this.renderizarVisualizacao();
                }
            } else {
                this.filaEspera = this.filaEspera.filter(j => j.nome !== jOriginal.nome);
                this.timesAtuais.forEach((time, tIdx) => {
                    if (Array.isArray(time)) {
                        this.timesAtuais[tIdx] = time.filter(j => j.nome !== jOriginal.nome);
                    }
                });
                State.salvarTimes(this.timesAtuais);
                this.renderizarVisualizacao();
            }
        },
        alternarSelecao(index) {
            const card = document.getElementById(`card-j-${index}`);
            let selecionou = false;
            if (this.jogadoresSelecionados.has(index)) {
                this.jogadoresSelecionados.delete(index); if (card) card.classList.remove('selecionado');
                selecionou = false;
            } else {
                this.jogadoresSelecionados.add(index); if (card) card.classList.add('selecionado');
                selecionou = true;
            }
            this.atualizarContador();
            this.sincronizarSelecaoComBanco(index, selecionou);
        },
        selecionarTodos(marcar) {
            State.data.jogadores.forEach((_, index) => {
                const card = document.getElementById(`card-j-${index}`);
                if (marcar) { this.jogadoresSelecionados.add(index); if (card) card.classList.add('selecionado'); }
                else { this.jogadoresSelecionados.delete(index); if (card) card.classList.remove('selecionado'); }
                this.sincronizarSelecaoComBanco(index, marcar);
            });
            this.atualizarContador();
        },
        atualizarContador() {
            const contador = document.getElementById('contadorSelecionados');
            if (contador) contador.innerText = `${this.jogadoresSelecionados.size} / ${State.data.jogadores.length}`;
        },
        embaralhar(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        },
        iniciarGeracao() {
            const jogadores = State.data.jogadores;
            if (this.jogadoresSelecionados.size === 0) { alert("Selecione pelo menos um jogador presente em 'Quem vai Jogar?'!"); return; }
            const tamanhoEl = document.querySelector('input[name="tamanho"]:checked');
            const tamanho = tamanhoEl ? parseInt(tamanhoEl.value) : 2;
            const modoPrincipal = document.querySelector('input[name="modoPrincipal"]:checked')?.value || 'manual';
            const tipoSorteio = document.querySelector('input[name="tipoSorteio"]:checked')?.value || 'normal';

            let presentes = Array.from(this.jogadoresSelecionados).map(i => ({ ...jogadores[i] }));
            const qtdTimesCompletos = Math.floor(presentes.length / tamanho);
            if (qtdTimesCompletos === 0 && modoPrincipal !== 'manual') {
                alert(`Você selecionou ${presentes.length} pessoa(s). Insuficiente para formar 1 time de ${tamanho}.`);
                return;
            }
            let qtdTimesIniciais = qtdTimesCompletos > 0 ? qtdTimesCompletos : 2;
            if (modoPrincipal === 'manual') this.prepararModoManual(presentes, qtdTimesIniciais);
            else this.gerarSorteioAutomatico(presentes, tamanho, qtdTimesCompletos, tipoSorteio);
        },
        gerarSorteioAutomatico(presentes, tamanho, qtdTimesCompletos, modo) {
            this.modoVisualizacao = 'sorteio';
            this.timeSelecionadoManual = 0;
            this.timesAtuais = Array.from({ length: qtdTimesCompletos }, () => []);
            this.filaEspera = [];
            const prepararLista = (lista) => {
                let grupos = {};
                lista.forEach(j => { if (!grupos[j.nivel]) grupos[j.nivel] = []; grupos[j.nivel].push(j); });
                let listaFinal = [];
                Object.keys(grupos).map(Number).sort((a, b) => b - a).forEach(nivel => {
                    listaFinal.push(...this.embaralhar(grupos[nivel]));
                });
                return listaFinal;
            };
            let totalVagas = qtdTimesCompletos * tamanho;
            if (modo === 'normal') {
                let listaOrdenada = prepararLista(presentes);
                let direcao = 1, indexTime = 0;
                for (let i = 0; i < totalVagas; i++) {
                    this.timesAtuais[indexTime].push(listaOrdenada[i]);
                    indexTime += direcao;
                    if (indexTime >= qtdTimesCompletos || indexTime < 0) { direcao *= -1; indexTime += direcao; }
                }
                for (let i = totalVagas; i < listaOrdenada.length; i++) this.filaEspera.push(listaOrdenada[i]);
                this.timesAtuais.forEach((time, idx) => { this.timesAtuais[idx] = this.embaralhar(time); });
            } else if (modo === 'misto') {
                let listaGeral = prepararLista(presentes);
                let jogadoresAtivos = listaGeral.slice(0, totalVagas);
                this.filaEspera = listaGeral.slice(totalVagas);
                let mulheres = jogadoresAtivos.filter(j => j.genero === 'f');
                let homens = jogadoresAtivos.filter(j => j.genero === 'm');
                let baseW = Math.floor(mulheres.length / qtdTimesCompletos);
                let extraW = mulheres.length % qtdTimesCompletos;
                let timesTemp = Array.from({ length: qtdTimesCompletos }, (_, i) => ({
                    id: i, jogadores: [], estrelas: 0, vagasM: baseW + (i < extraW ? 1 : 0), vagasTotais: tamanho
                }));
                let mIndex = 0;
                timesTemp.forEach(t => {
                    for (let i = 0; i < t.vagasM; i++) {
                        if (mIndex < mulheres.length) { let m = mulheres[mIndex++]; t.jogadores.push(m); t.estrelas += m.nivel; }
                    }
                });
                homens.forEach(h => {
                    let timesComVaga = timesTemp.filter(t => t.jogadores.length < t.vagasTotais);
                    timesComVaga.sort((a, b) => a.estrelas - b.estrelas);
                    if (timesComVaga.length > 0) { timesComVaga[0].jogadores.push(h); timesComVaga[0].estrelas += h.nivel; }
                });
                timesTemp.forEach(t => { this.timesAtuais[t.id] = this.embaralhar(t.jogadores); });
            } else if (modo === 'aleatorio') {
                let listaEmbaralhada = this.embaralhar(presentes);
                let jogadoresAtivos = listaEmbaralhada.slice(0, totalVagas);
                this.filaEspera = listaEmbaralhada.slice(totalVagas);
                for (let i = 0; i < totalVagas; i++) {
                    this.timesAtuais[i % qtdTimesCompletos].push(jogadoresAtivos[i]);
                }
                this.timesAtuais.forEach((time, idx) => { this.timesAtuais[idx] = this.embaralhar(time); });
            }
            State.salvarTimes(this.timesAtuais);
            this.renderizarVisualizacao();
        },
        prepararModoManual(presentes, qtdTimesIniciais) {
            this.modoVisualizacao = 'manual';
            this.timeSelecionadoManual = 0;
            this.timesAtuais = Array.from({ length: qtdTimesIniciais }, () => []);
            this.filaEspera = this.embaralhar([...presentes]).sort((a, b) => b.nivel - a.nivel);
            this.renderizarVisualizacao();
        },
        adicionarTimeManual() {
            this.timesAtuais.push([]);
            this.timeSelecionadoManual = this.timesAtuais.length - 1;
            this.renderizarVisualizacao();
        },
        removerTimeManual(index, event) {
            if (event) event.stopPropagation();
            if (this.timesAtuais[index].length > 0) {
                this.filaEspera.push(...this.timesAtuais[index]);
                this.filaEspera.sort((a, b) => b.nivel - a.nivel);
            }
            this.timesAtuais.splice(index, 1);
            if (this.timeSelecionadoManual === index) this.timeSelecionadoManual = Math.max(0, this.timesAtuais.length - 1);
            else if (this.timeSelecionadoManual > index) this.timeSelecionadoManual--;
            State.salvarTimes(this.timesAtuais);
            this.renderizarVisualizacao();
        },
        selecionarTimeManual(index) {
            this.timeSelecionadoManual = index;
            this.renderizarVisualizacao();
        },
        adicionarAoTimeAtivo(indexFila) {
            if (this.timesAtuais.length === 0) { alert("Crie um time primeiro clicando em '+ Novo Time'!"); return; }
            const jogador = this.filaEspera.splice(indexFila, 1)[0];
            this.timesAtuais[this.timeSelecionadoManual].push(jogador);
            State.salvarTimes(this.timesAtuais);
            this.renderizarVisualizacao();
        },
        removerDoTime(indexTime, indexJogador) {
            const jogador = this.timesAtuais[indexTime].splice(indexJogador, 1)[0];
            this.filaEspera.push(jogador);
            this.filaEspera.sort((a, b) => b.nivel - a.nivel);
            State.salvarTimes(this.timesAtuais);
            this.renderizarVisualizacao();
        },
        limparTodosTimes() {
            if (confirm("Tem certeza que deseja apagar todos os times sorteados?")) {
                this.timesAtuais = [];
                this.filaEspera = [];
                State.salvarTimes([]);
                State.salvarPartidas([]);
                this.renderizarVisualizacao();
            }
        },
        renderizarVisualizacao() {
            const container = document.getElementById('containerTimes');
            if (!container) return;
            const banco = document.getElementById('bancoManual');
            const instrucao = document.getElementById('instrucaoManual');
            const secao = document.getElementById('secaoResultados');
            const titulo = document.getElementById('tituloResultados');
            const acoesExtras = document.getElementById('acoesManuaisExtra');
            if (secao) secao.style.display = 'block';

            container.innerHTML = '';
            const mostrarBanco = this.filaEspera.length > 0 || this.modoVisualizacao === 'manual';
            if (mostrarBanco && banco && instrucao) {
                instrucao.style.display = 'block'; banco.style.display = 'flex';
                banco.innerHTML = '<div style="width: 100%; font-size: 0.85rem; color:#bbb; margin-bottom: 4px;">👥 Banco de Reservas (toque para colocar no time ativo):</div>';
                if (this.filaEspera.length === 0) banco.innerHTML += '<span style="color:#666; font-size:0.85rem;">Nenhum jogador no banco.</span>';
                this.filaEspera.forEach((j, i) => {
                    banco.innerHTML += `
                        <div class="chip-jogador" onclick="SorteioModule.adicionarAoTimeAtivo(${i})">
                            ${j.genero === 'm' ? this.svgM14 : this.svgF14} ${j.nome} <span style="color:#ffc107">${'⭐'.repeat(j.nivel)}</span>
                        </div>
                    `;
                });
            } else if (banco && instrucao) { instrucao.style.display = 'none'; banco.style.display = 'none'; }
            if (titulo) titulo.innerText = this.modoVisualizacao === 'manual' ? 'Montagem Manual' : 'Times Gerados';
            if (acoesExtras) acoesExtras.style.display = 'flex';

            if (this.timesAtuais.length === 0) {
                container.innerHTML = '<div class="aviso-vazio" style="padding: 16px; width: 100%;">⚠️ Nenhum time criado ou sorteado ainda. Clique em "+ Novo Time" acima para criar um time ou realize um sorteio!</div>';
                return;
            }
            this.timesAtuais.forEach((time, indice) => {
                let estrelasTotais = time.reduce((soma, j) => soma + j.nivel, 0);
                let classesCard = 'time-card' + (indice === this.timeSelecionadoManual ? ' ativo' : '');
                let htmlTime = `
                    <div class="${classesCard}" onclick="SorteioModule.selecionarTimeManual(${indice})">
                        <div class="time-header">
                            <span class="time-titulo-nome" style="font-weight: 600;">Time ${indice + 1}</span>
                            <div class="time-header-acoes" style="display: flex; align-items: center; gap: 8px;">
                                <span class="time-forca">⚡ Força: ${estrelasTotais}</span>
                                <button class="btn-fechar-time" onclick="SorteioModule.removerTimeManual(${indice}, event)" type="button" title="Excluir Time">✕</button>
                            </div>
                        </div>
                        <div class="time-lista">
                `;
                if (time.length === 0) {
                    htmlTime += '<span style="color: #777; font-size: 0.85rem; text-align: center; padding: 10px;">Time vazio. Toque para selecionar e adicione jogadores do banco.</span>';
                }
                time.forEach((j, idxJogador) => {
                    htmlTime += `
                        <div class="jogador-item-lista clicavel" onclick="SorteioModule.removerDoTime(${indice}, ${idxJogador}); event.stopPropagation();" title="Toque para remover">
                            <span class="j-nome-icone">${j.genero === 'm' ? this.svgM14 : this.svgF14} ${j.nome}</span>
                            <span style="color: #ffc107; font-size: 0.85rem;">${'⭐'.repeat(j.nivel)}</span>
                        </div>
                    `;
                });
                htmlTime += '</div></div>';
                container.innerHTML += htmlTime;
            });
            secao.style.display = 'block';
        }
    };

    // 6. PARTIDAS
    const PartidasModule = {
        timesDisponiveis: [], partidas: [], contadorPartidasTimes: {}, modoAberturaModal: 'filas', modoAnterior: 'sorteio',
        init() {
            State.subscribe((tipo) => { if (tipo === 'times' || tipo === 'partidas' || tipo === 'partida_ativa' || tipo === 'partida_finalizada') this.atualizar(); });
            const btnGerar = document.getElementById('btnGerarLista'); if (btnGerar) btnGerar.addEventListener('click', () => this.abrirModalGerar());
            const btnAdd = document.getElementById('btnAddPartidaManual'); if (btnAdd) btnAdd.addEventListener('click', () => this.abrirModalEscolherTimes('manual'));
            const btnLimpar = document.getElementById('btnLimparPartidas'); if (btnLimpar) btnLimpar.addEventListener('click', () => this.limparPartidas());

            const alternarModoPartidas = (e) => {
                const modo = document.querySelector('input[name="modoPartidas"]:checked')?.value || 'sorteio';

                // Se estava em Filas e quer mudar para Manual ou Sorteio
                if (this.modoAnterior === 'filas' && modo !== 'filas') {
                    const temPartidas = this.partidas && this.partidas.length > 0;
                    if (temPartidas) {
                        const confirmou = confirm("Ao sair da Fila as Partidas serão resetadas, deseja continuar?");
                        if (!confirmou) {
                            const radioFilas = document.querySelector('input[name="modoPartidas"][value="filas"]');
                            if (radioFilas) radioFilas.checked = true;
                            this.atualizarVisibilidadeModo();
                            return;
                        }
                        State.salvarPartidas([]);
                    }
                    this.modoAnterior = modo;
                    State.data.modoPartidas = modo;
                    localStorage.setItem('modo_partidas', modo);
                    this.atualizarVisibilidadeModo();
                    return;
                }

                if (modo === 'filas') {
                    const temPartidasAtivas = this.partidas && this.partidas.length > 0;
                    if (temPartidasAtivas) {
                        const confirmou = confirm("Atenção: Ao iniciar o Modo Filas, todas as partidas atuais e o histórico serão resetados. Deseja continuar?");
                        if (!confirmou) {
                            const radioAnterior = document.querySelector(`input[name="modoPartidas"][value="${this.modoAnterior || 'sorteio'}"]`);
                            if (radioAnterior) radioAnterior.checked = true;
                            this.atualizarVisibilidadeModo();
                            return;
                        }
                    }
                    this.modoAnterior = 'filas';
                    State.data.modoPartidas = 'filas';
                    localStorage.setItem('modo_partidas', 'filas');
                    this.atualizarVisibilidadeModo();
                    this.abrirModalEscolherTimes('filas');
                } else {
                    this.modoAnterior = modo;
                    State.data.modoPartidas = modo;
                    localStorage.setItem('modo_partidas', modo);
                    this.atualizarVisibilidadeModo();
                }
            };
            document.querySelectorAll('input[name="modoPartidas"]').forEach(r => r.addEventListener('change', alternarModoPartidas));
            const modoSalvo = localStorage.getItem('modo_partidas') || 'sorteio';
            State.data.modoPartidas = modoSalvo;
            this.modoAnterior = modoSalvo;
            const rAtual = document.querySelector(`input[name="modoPartidas"][value="${modoSalvo}"]`);
            if (rAtual) rAtual.checked = true;
            this.atualizar();
        },
        atualizar() {
            this.carregarTimes();
            this.partidas = State.data.partidas || [];
            this.recalcularContadores();
            this.atualizarVisibilidade();
            this.atualizarVisibilidadeModo();
            this.atualizarStatus();
            this.renderizar();
        },
        atualizarVisibilidade() {
            const avisoSemTimes = document.getElementById('secaoSemTimesPartidas');
            const conteudoSecaoPartidas = document.getElementById('conteudoSecaoPartidas');
            const temTimes = this.timesDisponiveis && this.timesDisponiveis.length >= 2;
            if (avisoSemTimes) avisoSemTimes.style.display = temTimes ? 'none' : 'block';
            if (conteudoSecaoPartidas) conteudoSecaoPartidas.style.display = temTimes ? 'flex' : 'none';
        },
        atualizarVisibilidadeModo() {
            const modo = document.querySelector('input[name="modoPartidas"]:checked')?.value || 'sorteio';
            const blocoSorteio = document.getElementById('blocoGeradorSorteio');
            const blocoListaPartidas = document.getElementById('blocoListaPartidas');
            const btnAddManual = document.getElementById('btnAddPartidaManual');
            const infoRegraFila = document.getElementById('infoRegraFilaPartidas');

            if (blocoSorteio) {
                blocoSorteio.style.display = (modo === 'sorteio') ? 'flex' : 'none';
            }

            if (btnAddManual) {
                // No modo sorteio e manual, o botão de jogo avulso fica disponível no card de partidas
                btnAddManual.style.display = (modo === 'sorteio' || modo === 'manual') ? 'inline-flex' : 'none';
            }

            if (blocoListaPartidas) {
                if (modo === 'manual') {
                    blocoListaPartidas.style.display = 'flex';
                } else {
                    blocoListaPartidas.style.display = (this.partidas && this.partidas.length > 0) ? 'flex' : 'none';
                }
            }

            if (infoRegraFila) {
                if (modo === 'filas' && this.partidas && this.partidas.length > 0) {
                    const mod = (this.partidas.find(p => p.modalidade)?.modalidade) || State.data.modalidadeFilaAuto || 'ganha2_descansa1_volta';
                    const txtRegra = mod === 'ganha2_descansa1_volta' ? '🔄 <strong>Regra da Fila:</strong> Ganha duas, descansa uma e volta' : '🔚 <strong>Regra da Fila:</strong> Ganha duas e vai pro final da fila';
                    infoRegraFila.innerHTML = txtRegra;
                    infoRegraFila.style.display = 'flex';
                } else {
                    infoRegraFila.style.display = 'none';
                }
            }
        },
        carregarTimes() {
            this.timesDisponiveis = [];
            (State.data.times || []).forEach((time, index) => {
                if (Array.isArray(time) && time.length > 0) {
                    this.timesDisponiveis.push(`Time ${index + 1} (${time.map(j => j.nome).join(' & ')})`);
                }
            });
        },
        recalcularContadores() {
            this.contadorPartidasTimes = {};
            this.timesDisponiveis.forEach(t => this.contadorPartidasTimes[t] = 0);
            this.partidas.forEach(p => {
                if (this.contadorPartidasTimes[p.time1] !== undefined) this.contadorPartidasTimes[p.time1]++;
                if (this.contadorPartidasTimes[p.time2] !== undefined) this.contadorPartidasTimes[p.time2]++;
            });
        },
        atualizarStatus() {
            const info = document.getElementById('infoTimesStatus');
            if (!info) return;
            if (this.timesDisponiveis.length > 0) {
                let html = `<div style="font-size: 0.9rem; margin-bottom: 6px;">👥 <strong>Times Carregados (${this.timesDisponiveis.length}):</strong></div><div class="lista-times-chips">`;
                this.timesDisponiveis.forEach(t => {
                    const count = this.contadorPartidasTimes[t] || 0;
                    html += `<div class="item-time-badge"><span>• ${t}</span> <span class="badge-jogos">${count} jogos</span></div>`;
                });
                html += '</div>'; info.innerHTML = html;
            } else {
                info.innerHTML = '⚠️ <strong>Nenhum time sorteado encontrado.</strong> Vá na seção <a href="#topico-sorteio" class="link-interno" onclick="OverlayModule.irPara(\'topico-sorteio\')">👥 Times</a> para sortear ou montar seus times primeiro!';
            }
        },
        abrirModalEscolherTimes(tipo = 'filas') {
            this.modoAberturaModal = tipo;
            if (this.timesDisponiveis.length < 2) {
                alert("Você precisa ter pelo menos 2 times cadastrados para criar uma partida!");
                this.fecharModalEscolherTimes(true);
                return;
            }
            const select1 = document.getElementById('selectTime1');
            const select2 = document.getElementById('selectTime2');
            const modal = document.getElementById('modalEscolherTimes');
            const tituloModal = document.getElementById('tituloModalEscolherTimes');
            const campoMod = document.getElementById('campoModalidadeFila');
            const btnConf = document.getElementById('btnConfirmarEscolhaTimes');
            const subTxt = document.getElementById('textoSubtituloModalTimes');

            if (!select1 || !select2 || !modal) return;
            
            if (tipo === 'filas') {
                if (tituloModal) tituloModal.textContent = "Nova Fila Automática";
                if (subTxt) subTxt.textContent = "Escolha os times iniciais e a regra de rotação da fila:";
                if (campoMod) campoMod.style.display = 'flex';
                if (btnConf) btnConf.textContent = "▶ Começar Partidas";
            } else {
                if (tituloModal) tituloModal.textContent = "Adicionar Partida Manual";
                if (subTxt) subTxt.textContent = "Escolha os times que vão se enfrentar:";
                if (campoMod) campoMod.style.display = 'none';
                if (btnConf) btnConf.textContent = "✓ Adicionar Partida";
            }

            select1.innerHTML = '';
            select2.innerHTML = '';
            this.timesDisponiveis.forEach((timeNome, idx) => {
                const opt1 = document.createElement('option');
                opt1.value = timeNome;
                opt1.textContent = timeNome;
                if (idx === 0) opt1.selected = true;
                select1.appendChild(opt1);

                const opt2 = document.createElement('option');
                opt2.value = timeNome;
                opt2.textContent = timeNome;
                if (idx === 1) opt2.selected = true;
                select2.appendChild(opt2);
            });
            modal.style.display = 'flex';
            document.body.classList.add('modal-aberto');
        },
        fecharModalEscolherTimes(cancelou = false) {
            const modal = document.getElementById('modalEscolherTimes');
            if (modal) modal.style.display = 'none';
            document.body.classList.remove('modal-aberto');
            if (cancelou && this.modoAberturaModal === 'filas') {
                const rSorteio = document.querySelector('input[name="modoPartidas"][value="sorteio"]');
                if (rSorteio) rSorteio.checked = true;
                this.atualizarVisibilidadeModo();
            }
        },
        confirmarPartidaEscolhida() {
            const select1 = document.getElementById('selectTime1');
            const select2 = document.getElementById('selectTime2');
            if (!select1 || !select2) return;
            const t1 = select1.value;
            const t2 = select2.value;
            if (!t1 || !t2) {
                alert("Selecione os dois times para iniciar a partida!");
                return;
            }
            if (t1 === t2) {
                alert("Escolha dois times diferentes para o confronto!");
                return;
            }

            if (this.modoAberturaModal === 'filas') {
                State.data.modoPartidas = 'filas';
                this.modoAnterior = 'filas';
                localStorage.setItem('modo_partidas', 'filas');
                const modalidade = document.querySelector('input[name="modalidadeFilaAuto"]:checked')?.value || 'ganha2_descansa1_volta';
                State.data.modalidadeFilaAuto = modalidade;
                State.data.filaTimes = this.timesDisponiveis.filter(t => t !== t1 && t !== t2);
                State.salvar();

                // Cria apenas 1 partida inicial (Jogo 1) com status 'ativa'
                this.partidas = [{
                    id: 1,
                    time1: t1,
                    time2: t2,
                    vencedor: null,
                    status: 'ativa',
                    modalidade
                }];
                State.salvarPartidas(this.partidas);
                State.carregarPartidaNoPlacar(t1, t2, 1);
                this.fecharModalEscolherTimes(false);
                if (typeof OverlayModule !== 'undefined' && OverlayModule.fechar) {
                    OverlayModule.fechar();
                }
            } else {
                // Modo Manual
                State.data.modoPartidas = 'manual';
                this.modoAnterior = 'manual';
                localStorage.setItem('modo_partidas', 'manual');
                const novoId = this.partidas.length > 0 ? Math.max(...this.partidas.map(p => p.id)) + 1 : 1;
                const deveSerAtiva = this.partidas.length === 0 || !this.partidas.some(p => p.status === 'ativa');
                this.partidas.push({ id: novoId, time1: t1, time2: t2, vencedor: null, status: deveSerAtiva ? 'ativa' : 'bloqueada' });
                State.salvarPartidas(this.partidas);
                if (deveSerAtiva || !State.data.partidaAtual) {
                    State.carregarPartidaNoPlacar(t1, t2, novoId);
                }
                this.fecharModalEscolherTimes(false);
            }
        },
        abrirModalGerar() {
            if (this.timesDisponiveis.length < 2) { alert("Você precisa ter pelo menos 2 times sorteados para gerar a lista de partidas!"); return; }
            if (this.partidas.length > 0) {
                if (confirm("Gerar uma nova lista de partidas vai zerar a fila atual e o histórico do ranking. Deseja continuar?")) this.executarGeracao();
            } else { this.executarGeracao(); }
        },
        executarGeracao() {
            const horasEl = document.getElementById('selectHoras');
            const horas = horasEl ? parseInt(horasEl.value) : 2;
            const ritmo = document.querySelector('input[name="ritmoSorteio"]:checked')?.value || 'equilibrado';
            const numTimes = this.timesDisponiveis.length;
            const partidasBaseAlvo = horas * 12;
            let jogosPorTime = Math.round((partidasBaseAlvo * 2) / numTimes);
            if (jogosPorTime < 1) jogosPorTime = 1;
            const totalPartidas = Math.round((jogosPorTime * numTimes) / 2);
            this.contadorPartidasTimes = {};
            this.timesDisponiveis.forEach(t => this.contadorPartidasTimes[t] = 0);
            this.partidas = [];
            let idContador = 1;

            if (ritmo === 'intensidade' && numTimes >= 4) {
                // Modo Intensidade: Organiza em pares/blocos de 2 jogos consecutivos
                for (let i = 0; i < totalPartidas; i++) {
                    let t1, t2;
                    if (i % 2 === 1 && i > 0) {
                        const ult = this.partidas[i - 1];
                        t1 = ult.time1;
                        let outros = this.timesDisponiveis.filter(t => t !== t1 && t !== ult.time2)
                            .sort((a, b) => (this.contadorPartidasTimes[a] || 0) - (this.contadorPartidasTimes[b] || 0));
                        t2 = outros[0] || this.timesDisponiveis.find(t => t !== t1);
                    } else {
                        let ordenados = [...this.timesDisponiveis].sort((a, b) => {
                            if (this.contadorPartidasTimes[a] !== this.contadorPartidasTimes[b]) return this.contadorPartidasTimes[a] - this.contadorPartidasTimes[b];
                            return Math.random() - 0.5;
                        });
                        t1 = ordenados[0];
                        t2 = ordenados[1];
                    }
                    this.contadorPartidasTimes[t1]++;
                    this.contadorPartidasTimes[t2]++;
                    this.partidas.push({ id: idContador++, time1: t1, time2: t2, vencedor: null, status: i === 0 ? 'ativa' : 'bloqueada' });
                }
            } else {
                // Modo Equilibrado (Joga 1, Folga 1): Evita que o mesmo time jogue duas vezes seguidas se houver 3+ times
                for (let i = 0; i < totalPartidas; i++) {
                    let ordenados = [...this.timesDisponiveis].sort((a, b) => {
                        if (this.contadorPartidasTimes[a] !== this.contadorPartidasTimes[b]) return this.contadorPartidasTimes[a] - this.contadorPartidasTimes[b];
                        return Math.random() - 0.5;
                    });
                    let t1 = ordenados[0], t2 = ordenados[1];
                    if (numTimes > 2 && i > 0) {
                        const ult = this.partidas[i - 1];
                        let descansados = ordenados.filter(t => t !== ult.time1 && t !== ult.time2);
                        if (descansados.length >= 2) {
                            t1 = descansados[0];
                            t2 = descansados[1];
                        } else if (descansados.length === 1) {
                            t1 = descansados[0];
                            t2 = ordenados.find(t => t !== t1);
                        }
                    }
                    this.contadorPartidasTimes[t1]++;
                    this.contadorPartidasTimes[t2]++;
                    this.partidas.push({ id: idContador++, time1: t1, time2: t2, vencedor: null, status: i === 0 ? 'ativa' : 'bloqueada' });
                }
            }

            State.data.modoPartidas = 'sorteio';
            this.modoAnterior = 'sorteio';
            localStorage.setItem('modo_partidas', 'sorteio');
            const rSorteio = document.querySelector('input[name="modoPartidas"][value="sorteio"]');
            if (rSorteio) rSorteio.checked = true;

            State.salvarPartidas(this.partidas);
            if (this.partidas.length > 0) {
                const p = this.partidas[0];
                State.carregarPartidaNoPlacar(p.time1, p.time2, p.id);
            }
            this.atualizarVisibilidadeModo();
        },
        adicionarPartidaManual() {
            this.abrirModalEscolherTimes('manual');
        },
        limparPartidas() {
            if (confirm("Tem certeza que deseja apagar todas as partidas e o histórico?")) State.salvarPartidas([]);
        },
        apagarPartida(id) {
            const p = this.partidas.find(item => item.id === id);
            if (!p) return;
            if (confirm(`Deseja realmente apagar a partida Jogo ${p.id} (${p.time1} vs ${p.time2})?`)) {
                const eraAtiva = p.status === 'ativa' || (State.data.partidaAtual && State.data.partidaAtual.idPartida === id);
                this.partidas = this.partidas.filter(item => item.id !== id);
                State.salvarPartidas(this.partidas);
                if (eraAtiva) {
                    const prox = this.partidas.find(item => item.status === 'ativa' || !item.vencedor);
                    if (prox) {
                        prox.status = 'ativa';
                        State.salvarPartidas(this.partidas);
                        State.carregarPartidaNoPlacar(prox.time1, prox.time2, prox.id);
                    } else {
                        State.data.partidaAtual = null;
                        localStorage.removeItem(State.KEYS.PARTIDA_ATUAL);
                        State.notify('partida_ativa', null);
                    }
                }
                this.atualizar();
            }
        },
        iniciarNoPlacar(id) {
            const p = this.partidas.find(item => item.id === id);
            if (!p) return;
            const jaEstaNoPlacar = State.data.partidaAtual && State.data.partidaAtual.idPartida === id;
            if (jaEstaNoPlacar) {
                OverlayModule.fechar();
                return;
            }
            State.carregarPartidaNoPlacar(p.time1, p.time2, p.id);
            this.renderizar();
        },
        pausarPartida(id) {
            State.data.partidaAtual = null;
            localStorage.removeItem(State.KEYS.PARTIDA_ATUAL);
            State.notify('partida_ativa', null);
            this.renderizar();
        },
        renderizar() {
            const corpo = document.getElementById('listaPartidasCorpo');
            if (!corpo) return;
            corpo.innerHTML = '';
            if (this.partidas.length === 0) {
                const modo = document.querySelector('input[name="modoPartidas"]:checked')?.value || 'sorteio';
                if (modo === 'manual') {
                    corpo.innerHTML = '<div class="aviso-vazio">Nenhuma partida adicionada ainda. Clique em "+ Adicionar Partida" acima para criar os confrontos!</div>';
                } else {
                    corpo.innerHTML = '<div class="aviso-vazio">Nenhuma partida gerada. Clique em "📅 Gerar Partidas" acima para iniciar a rodada!</div>';
                }
                return;
            }
            const pa = State.data.partidaAtual;
            this.partidas.forEach((p) => {
                const linha = document.createElement('div');
                linha.className = `partida-linha ${p.status}`;
                linha.id = `linha-partida-${p.id}`;
                let acoes = '';
                if (p.vencedor) {
                    const placarTxt = (p.placar1 !== undefined && p.placar2 !== undefined) ? ` (${p.placar1} x ${p.placar2})` : '';
                    acoes = `<span class="badge-vencedor">🏆 ${p.vencedor}${placarTxt}</span>`;
                } else if (p.status === 'ativa') {
                    const isJogando = pa && pa.idPartida === p.id;
                    acoes = `
                        <div class="partida-acoes-ativa" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <button class="btn-jogar-placar" type="button" onclick="PartidasModule.iniciarNoPlacar(${p.id})">
                                ${isJogando ? '▶ No Placar (Jogando)' : '▶ Jogar no Placar'}
                            </button>
                            ${isJogando ? `<button class="btn-pausar-partida" type="button" onclick="PartidasModule.pausarPartida(${p.id})">⏸️ Pausar Partida</button>` : ''}
                        </div>
                    `;
                } else {
                    acoes = '<span class="badge-aguardando">⏳ Aguardando...</span>';
                }
                linha.innerHTML = `
                    <button class="btn-fechar-partida" onclick="PartidasModule.apagarPartida(${p.id})" type="button" title="Excluir Partida">✕</button>
                    <div class="col-partida">
                        <div class="partida-info-texto">
                            <span class="partida-numero">Jogo ${p.id}</span>
                            <span class="partida-confronto">${p.time1} <span class="versus-tag">vs</span> ${p.time2}</span>
                        </div>
                    </div>
                    <div class="col-vencedor">${acoes}</div>
                `;
                corpo.appendChild(linha);
            });
        }
    };

    // 7. RANKING
    const RankingModule = {
        init() {
            State.subscribe((tipo) => {
                if (tipo === 'partidas' || tipo === 'times' || tipo === 'partida_finalizada') this.render();
            });
            this.render();
        },
        formatarTrofeus(qtd) {
            if (qtd <= 0) return '—';
            let linhas = [];
            for (let i = 0; i < qtd; i += 5) linhas.push('🏆'.repeat(Math.min(5, qtd - i)));
            return linhas.join('<br>');
        },
        render() {
            const ranking = State.obterRanking();
            const secaoPodio = document.getElementById('secaoPodio');
            const secaoCompleta = document.getElementById('secaoRankingCompleto');
            const secaoSemTimes = document.getElementById('secaoSemTimes');
            const containerPodio = document.getElementById('containerPodio');
            const listaCompleta = document.getElementById('listaRankingCompleta');
            if (!containerPodio || !listaCompleta) return;

            const semPartidas = ranking.length === 0;
            if (secaoSemTimes) {
                secaoSemTimes.style.display = semPartidas ? 'block' : 'none';
            }
            if (secaoPodio) secaoPodio.style.display = 'block';
            if (secaoCompleta) secaoCompleta.style.display = 'block';

            let p1 = ranking[0] || { nomeTime: '1º Lugar', membros: 'Aguardando jogos', vitorias: 0 };
            let p2 = ranking[1] || { nomeTime: '2º Lugar', membros: 'Aguardando jogos', vitorias: 0 };
            let p3 = ranking[2] || { nomeTime: '3º Lugar', membros: 'Aguardando jogos', vitorias: 0 };

            containerPodio.innerHTML = `
                <div class="podio-coluna">
                    <div class="podio-info-topo"><span class="podio-avatar" title="${p2.nomeTime}">${p2.nomeTime}</span><span class="podio-membros" title="${p2.membros}">(${p2.membros})</span></div>
                    <div class="podio-bloco podio-2"><span class="podio-posicao-num">2º</span><div class="podio-trofeus">${this.formatarTrofeus(p2.vitorias)}</div></div>
                </div>
                <div class="podio-coluna">
                    <div class="podio-info-topo"><span class="podio-avatar" title="${p1.nomeTime}">${p1.nomeTime}</span><span class="podio-membros" title="${p1.membros}">(${p1.membros})</span></div>
                    <div class="podio-bloco podio-1"><span class="podio-posicao-num">1º</span><div class="podio-trofeus">${this.formatarTrofeus(p1.vitorias)}</div></div>
                </div>
                <div class="podio-coluna">
                    <div class="podio-info-topo"><span class="podio-avatar" title="${p3.nomeTime}">${p3.nomeTime}</span><span class="podio-membros" title="${p3.membros}">(${p3.membros})</span></div>
                    <div class="podio-bloco podio-3"><span class="podio-posicao-num">3º</span><div class="podio-trofeus">${this.formatarTrofeus(p3.vitorias)}</div></div>
                </div>
            `;

            listaCompleta.innerHTML = '';
            if (semPartidas) {
                listaCompleta.innerHTML = '<div class="aviso-vazio" style="padding: 12px;">Os times aparecerão aqui conforme as partidas forem jogadas e finalizadas no placar.</div>';
            } else {
                ranking.forEach((t, i) => {
                    let classe = 'ranking-card';
                    if (i === 0) classe += ' lider';
                    else if (i === 1) classe += ' vice';
                    else if (i === 2) classe += ' terceiro';
                    listaCompleta.innerHTML += `
                        <div class="${classe}">
                            <div class="ranking-info">
                                <span class="ranking-pos">${i + 1}º</span>
                                <div class="ranking-detalhes-time">
                                    <div class="ranking-nome-time">${t.nomeTime}</div>
                                    <div class="ranking-membros-txt">(${t.membros || 'Avulso'})</div>
                                    <div class="ranking-stats-sub">${t.jogos} jogos | ${t.vitorias} vitórias / ${t.derrotas} derrotas | Saldo: ${t.saldoPontos > 0 ? '+' : ''}${t.saldoPontos}</div>
                                </div>
                            </div>
                            <div class="ranking-qtd-trofeus">${this.formatarTrofeus(t.vitorias)}</div>
                        </div>
                    `;
                });
            }
        }
    };

    // 8. MENU & CONFIGURAÇÕES (☰)
    function initMenuConfig() {
        const btnMenuToggle = document.getElementById('btnMenuToggle');
        const dropdownMenu = document.getElementById('dropdownMenu');

        const btnToggleFullscreen = document.getElementById('btnToggleFullscreen');
        const checkFullscreen = document.getElementById('checkFullscreen');
        const labelFullscreen = document.getElementById('labelFullscreen');

        const btnToggleFig = document.getElementById('btnToggleFigurinhas');
        const checkFig = document.getElementById('checkFigurinhas');
        const labelFig = document.getElementById('labelFigurinhas');

        const btnToggleTema = document.getElementById('btnToggleTema');
        const checkTema = document.getElementById('checkTema');
        const labelTema = document.getElementById('labelTema');

        const overlayIntro = document.getElementById('overlayFigurinhaInicial');

        const fecharDropdown = () => {
            if (dropdownMenu) dropdownMenu.classList.remove('ativo');
        };

        const abrirDropdown = () => {
            if (dropdownMenu) dropdownMenu.classList.add('ativo');
        };

        const toggleDropdown = (e) => {
            if (e) {
                e.stopPropagation();
            }
            if (dropdownMenu && dropdownMenu.classList.contains('ativo')) {
                fecharDropdown();
            } else {
                abrirDropdown();
            }
        };

        // Toggle do Menu Dropdown (☰)
        if (btnMenuToggle && dropdownMenu) {
            btnMenuToggle.addEventListener('click', toggleDropdown);

            dropdownMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#btnMenuToggle') && !e.target.closest('#dropdownMenu')) {
                    fecharDropdown();
                }
            });
        }

        // TELA CHEIA (FULLSCREEN)
        function atualizarFullscreenUI() {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (checkFullscreen) checkFullscreen.checked = isFull;
            if (labelFullscreen) labelFullscreen.textContent = isFull ? '🖥️ Tela Cheia: Ativada' : '🖥️ Tela Cheia: Desativada';
        }

        function alternarFullscreen() {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        }

        if (btnToggleFullscreen) {
            btnToggleFullscreen.addEventListener('click', (e) => {
                if (e.target !== checkFullscreen && !e.target.closest('.switch')) {
                    if (checkFullscreen) {
                        checkFullscreen.checked = !checkFullscreen.checked;
                        alternarFullscreen();
                    }
                }
            });
        }

        if (checkFullscreen) {
            checkFullscreen.addEventListener('change', () => {
                alternarFullscreen();
            });
        }

        document.addEventListener('fullscreenchange', atualizarFullscreenUI);
        document.addEventListener('webkitfullscreenchange', atualizarFullscreenUI);
        atualizarFullscreenUI();

        // FIGURINHAS
        function atualizarFigurinhasUI() {
            const ativa = !!State.data.configs.figurinhas;
            if (checkFig) checkFig.checked = ativa;
            if (labelFig) labelFig.textContent = ativa ? '🖼️ Figurinhas: Ativadas' : '🖼️ Figurinhas: Desativadas';
        }

        if (btnToggleFig) {
            btnToggleFig.addEventListener('click', (e) => {
                if (e.target !== checkFig && !e.target.closest('.switch')) {
                    if (checkFig) {
                        checkFig.checked = !checkFig.checked;
                        State.salvarConfigs({ figurinhas: checkFig.checked });
                        atualizarFigurinhasUI();
                    }
                }
            });
        }

        if (checkFig) {
            checkFig.addEventListener('change', () => {
                State.salvarConfigs({ figurinhas: checkFig.checked });
                atualizarFigurinhasUI();
            });
        }
        atualizarFigurinhasUI();

        // TEMA
        function aplicarTemaUI() {
            const tema = State.data.configs.tema || 'claro';
            if (tema === 'escuro') {
                document.body.classList.add('tema-escuro');
                if (checkTema) checkTema.checked = false;
                if (labelTema) labelTema.textContent = '🌙 Tema: Escuro';
            } else {
                document.body.classList.remove('tema-escuro');
                if (checkTema) checkTema.checked = true;
                if (labelTema) labelTema.textContent = '☀️ Tema: Vidro';
            }
        }

        if (btnToggleTema) {
            btnToggleTema.addEventListener('click', (e) => {
                if (e.target !== checkTema && !e.target.closest('.switch')) {
                    if (checkTema) {
                        checkTema.checked = !checkTema.checked;
                        const novo = checkTema.checked ? 'claro' : 'escuro';
                        State.salvarConfigs({ tema: novo });
                        aplicarTemaUI();
                    }
                }
            });
        }

        if (checkTema) {
            checkTema.addEventListener('change', () => {
                const novo = checkTema.checked ? 'claro' : 'escuro';
                State.salvarConfigs({ tema: novo });
                aplicarTemaUI();
            });
        }
        aplicarTemaUI();

        if (overlayIntro) {
            if (State.data.configs.figurinhas === true) {
                overlayIntro.style.display = 'flex';
                const fechar = () => { overlayIntro.style.display = 'none'; overlayIntro.remove(); };
                overlayIntro.addEventListener('click', fechar);
                overlayIntro.addEventListener('pointerup', fechar);
            } else {
                overlayIntro.remove();
            }
        }
    }

    // 9. INICIALIZAÇÃO
    function inicializarApp() {
        Placar.init();
        OverlayModule.init();
        JogadoresModule.init();
        SorteioModule.init();
        PartidasModule.init();
        RankingModule.init();
        initMenuConfig();
    }

    window.JogadoresModule = JogadoresModule;
    window.SorteioModule = SorteioModule;
    window.PartidasModule = PartidasModule;
    window.RankingModule = RankingModule;
    window.Placar = Placar;

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', inicializarApp);
    } else {
        inicializarApp();
    }
})();
