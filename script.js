let combatentes = [];
let indexTurnoAtual = -1;
let rodadaAtual = 1;
let turnoGeralCount = 0;

const form = document.getElementById('form-combatente');
const lista = document.getElementById('lista-combatentes');
const btnOrdenar = document.getElementById('btn-ordenar');
const btnProximo = document.getElementById('btn-proximo');
const elemRodada = document.getElementById('numero-rodada');
const elemTurno = document.getElementById('numero-turno');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const iniVal = document.getElementById('iniciativa').value;
    const hpMaxVal = document.getElementById('hpMax').value;

    if (!nome || iniVal === '' || hpMaxVal === '') return;

    const iniciativa = Math.max(0, Number(iniVal));
    const hpMax = Math.max(1, Number(hpMaxVal));

    combatentes.push({ 
        id: Date.now(), 
        nome, 
        iniciativa, 
        agilidade: 0, 
        hpMax: hpMax,
        hpAtual: hpMax, // Começa com o HP cheio
        turnosMorrendo: 0,
        esperarVolta: false,
        condicoes: [] 
    });

    form.reset();
    renderizar();
});

btnOrdenar.addEventListener('click', () => {
    if (combatentes.length === 0) return;

    combatentes.sort((a, b) => {
        if (b.iniciativa === a.iniciativa) {
            return b.agilidade - a.agilidade;
        }
        return b.iniciativa - a.iniciativa;
    });

    indexTurnoAtual = 0;
    rodadaAtual = 1;
    turnoGeralCount = 1;

    if (combatentes[0].hpAtual <= 0) {
        combatentes[0].esperarVolta = false;
    }

    renderizar();
});

btnProximo.addEventListener('click', () => {
    if (combatentes.length === 0) return;

    indexTurnoAtual++;
    if (indexTurnoAtual >= combatentes.length) {
        indexTurnoAtual = 0;
        rodadaAtual++;
    }

    turnoGeralCount++;

    const ativo = combatentes[indexTurnoAtual];
    if (ativo && ativo.hpAtual <= 0 && ativo.turnosMorrendo < 3) {
        if (ativo.esperarVolta) {
            ativo.esperarVolta = false;
        } else {
            ativo.turnosMorrendo++;
        }
    }

    renderizar();
});

function alterarAgilidade(id, novaAgilidade) {
    const c = combatentes.find(item => item.id === id);
    if (c) {
        c.agilidade = Number(novaAgilidade) || 0;
    }
}

function verificarMachucado(c) {
    const metadeHP = c.hpMax / 2;
    const indexMachucado = c.condicoes.indexOf("Machucado");

    // Adiciona "Machucado" se estiver com metade ou menos do HP e ainda não tiver a condição
    if (c.hpAtual <= metadeHP && indexMachucado === -1) {
        c.condicoes.push("Machucado");
    } 
    // Remove "Machucado" se subiu para mais da metade do HP
    else if (c.hpAtual > metadeHP && indexMachucado !== -1) {
        c.condicoes.splice(indexMachucado, 1);
    }
}

function aplicarDanoCura(id, multiplicador) {
    const input = document.getElementById(`qtd-${id}`);
    const valor = Number(input.value);
    
    if (!valor || valor <= 0) return;

    const c = combatentes.find(item => item.id === id);
    if (c) {
        const estavaVivo = c.hpAtual > 0;

        c.hpAtual += (valor * multiplicador);
        
        // Limita o HP ao máximo definido
        if (c.hpAtual > c.hpMax) {
            c.hpAtual = c.hpMax;
        }

        // Se acabou de cair a 0 ou menos de HP, aguarda chegar no turno dele para iniciar a volta
        if (estavaVivo && c.hpAtual <= 0) {
            const turnoDeleAgora = combatentes[indexTurnoAtual]?.id === c.id;
            c.esperarVolta = !turnoDeleAgora;
        }

        verificarMachucado(c);
        renderizar();
    }
}

function adicionarCondicao(id) {
    const input = document.getElementById(`cond-input-${id}`);
    const texto = input.value.trim();
    if (!texto) return;

    const c = combatentes.find(item => item.id === id);
    if (c) {
        c.condicoes.push(texto);
        renderizar();
    }
}

function removerCondicao(id, condIndex) {
    const c = combatentes.find(item => item.id === id);
    if (c) {
        c.condicoes.splice(condIndex, 1);
        renderizar();
    }
}

function remover(id) {
    combatentes = combatentes.filter(item => item.id !== id);
    renderizar();
}

function renderizar() {
    elemRodada.textContent = rodadaAtual;
    elemTurno.textContent = turnoGeralCount;

    lista.innerHTML = '';
    
    combatentes.forEach((c, index) => {
        const card = document.createElement('div');
        card.className = `card-combatente ${index === indexTurnoAtual ? 'ativo' : ''}`;
        
        const htmlCondicoes = c.condicoes.map((cond, condIdx) => `
            <span class="badge-condicao" onclick="removerCondicao(${c.id}, ${condIdx})" title="Clique para remover">
                ${cond} ✕
            </span>
        `).join('');

        let statusMorteHTML = '';
        if (c.hpAtual <= 0) {
            if (c.turnosMorrendo >= 3) {
                statusMorteHTML = `<div class="badge-morte">☠️ MORTO (3/3 turnos)</div>`;
            } else {
                statusMorteHTML = `<div class="badge-morrendo">💀 Morrendo (${c.turnosMorrendo}/3 turnos)</div>`;
            }
        } else if (c.turnosMorrendo > 0) {
            statusMorteHTML = `<div class="badge-salvo">❤️ Salvo (Acumulado: ${c.turnosMorrendo}/3)</div>`;
        }

        card.innerHTML = `
            <div class="combatente-info">
                <div>
                    <strong>${c.nome}</strong> 
                    <span class="subtexto-ini">(Ini: ${c.iniciativa} | Agi: 
                        <input type="number" value="${c.agilidade}" class="input-dano" style="width: 45px !important;" onchange="alterarAgilidade(${c.id}, this.value)">)
                    </span>
                </div>
                
                ${statusMorteHTML}

                <div class="condicoes-container">
                    ${htmlCondicoes}
                </div>

                <div class="add-condicao-box">
                    <input type="text" id="cond-input-${c.id}" placeholder="+ Condição..." class="input-condicao" onkeypress="if(event.key === 'Enter') adicionarCondicao(${c.id})">
                    <button class="btn-add-condicao" onclick="adicionarCondicao(${c.id})">+</button>
                </div>
            </div>

            <div class="hp-area">
                <div class="hp-display">
                    HP: <span class="${c.hpAtual <= 0 ? 'hp-zero' : ''}">${c.hpAtual}/${c.hpMax}</span>
                </div>
                
                <div class="hp-acoes">
                    <input type="number" id="qtd-${c.id}" placeholder="Qtd" class="input-dano" min="1">
                    <button class="btn-dano" onclick="aplicarDanoCura(${c.id}, -1)">⚔️ Dano</button>
                    <button class="btn-cura" onclick="aplicarDanoCura(${c.id}, 1)">❤️ Cura</button>
                </div>
            </div>

            <button class="btn-remover" onclick="remover(${c.id})" title="Remover combatente">❌</button>
        `;
        lista.appendChild(card);
    });
}
