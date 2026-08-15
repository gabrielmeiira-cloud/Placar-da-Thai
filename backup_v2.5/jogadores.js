window.addEventListener('DOMContentLoaded', () => {
    const svgM = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="icone-m"><circle cx="10" cy="14" r="6"></circle><line x1="14.24" y1="9.76" x2="20" y2="4"></line><polyline points="15 4 20 4 20 9"></polyline></svg>`;
    const svgF = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="icone-f"><circle cx="12" cy="9" r="6"></circle><line x1="12" y1="15" x2="12" y2="22"></line><line x1="9" y1="19" x2="15" y2="19"></line></svg>`;

    let jogadoresCadastro = [];

    function carregarJogadoresCadastro() {
        const dados = localStorage.getItem('base_jogadores');
        jogadoresCadastro = dados ? JSON.parse(dados) : [];
        renderizarListaJogadores();
    }

    function salvarJogadoresCadastro() {
        localStorage.setItem('base_jogadores', JSON.stringify(jogadoresCadastro));
    }

    function renderizarListaJogadores() {
        const listaJogadores = document.getElementById('listaJogadores');
        if(!listaJogadores) return;
        const contadorJogadores = document.getElementById('contadorJogadores');
        contadorJogadores.textContent = jogadoresCadastro.length;
        if (jogadoresCadastro.length === 0) {
            listaJogadores.innerHTML = '<span style="color: #777; font-size: 0.85rem; text-align: center; padding: 10px;">Nenhum jogador cadastrado ainda.</span>';
            return;
        }
        listaJogadores.innerHTML = '';
        jogadoresCadastro.forEach((j, index) => {
            const item = document.createElement('div');
            item.className = 'jogador-item';
            item.innerHTML = `
                <div class="jogador-info">
                    <span class="jogador-nome">${j.nome}</span>
                    <div class="jogador-detalhes">
                        ${j.genero === 'm' ? svgM : svgF}
                        <span class="jogador-estrelas">${'⭐'.repeat(j.nivel)}</span>
                    </div>
                </div>
                <button class="btn-excluir" type="button" onclick="removerJogador(${index})">Excluir</button>
            `;
            listaJogadores.appendChild(item);
        });
    }


    const btnAdicionar = document.getElementById('btnAdicionar');
    if(btnAdicionar) {
        btnAdicionar.addEventListener('click', () => {
            const nome = document.getElementById('inputNome').value.trim();
            const genero = document.querySelector('input[name="sexo"]:checked').value;
            const nivel = parseInt(document.getElementById('selectEstrelas').value);
            if (!nome) {
                alert('Por favor, digite o nome do jogador.');
                return;
            }
            jogadoresCadastro.push({ nome, genero, nivel });
            salvarJogadoresCadastro();
            renderizarListaJogadores();
            document.getElementById('inputNome').value = '';
            document.getElementById('inputNome').focus();
        });
    }


    window.removerJogador = function(index) {
        jogadoresCadastro.splice(index, 1);
        salvarJogadoresCadastro();
        renderizarListaJogadores();
    };

    carregarJogadoresCadastro();
});