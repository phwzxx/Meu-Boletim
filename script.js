// Configuração fixa do aluno
const CONFIG_ALUNO = {
  turma: "9B",
  numeroChamada: 29,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variáveis de sessão (mantidas apenas em memória)
let pinSessao = "";
let modoEdicao = false;

// Dados fictícios locais (usados como fallback caso a API não retorne dados)
const dadosDisciplinasLocais = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Estado atual das disciplinas exibidas na tela
let disciplinasAtuais = [];

// Frequência fictícia/demonstrativa
const FREQUENCIA_DEMONSTRATIVA = "92%";

// Função para normalizar dados antigos (0-100 para 0-10, vírgula para ponto, etc.)
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let numero = parseFloat(valor);

  if (isNaN(numero)) {
    return null;
  }

  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  return null;
}

// Formatação de notas para exibição
function formatarNotaExibicao(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

// Formatação de notas para valor de campo input durante edição
function formatarNotaInput(valor) {
  const n = normalizarNota(valor);
  if (n === null) return "";
  return n.toString().replace(".", ",");
}

// Função para calcular média das notas disponíveis
function calcularMedia(notas) {
  const notasValidas = notas.filter(n => n !== null);
  if (notasValidas.length === 0) return null;

  const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
  return soma / notasValidas.length;
}

// Função para somar faltas dos trimestres
function somarFaltas(faltasArray) {
  if (!Array.isArray(faltasArray)) return 0;
  return faltasArray.reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
}

// Exibe mensagens de aviso ou status na interface
function exibirMensagem(texto, tipo = "erro") {
  const msgEl = document.getElementById("mensagem-status");
  if (!msgEl) return;
  msgEl.textContent = texto;
  msgEl.className = "mensagem-status " + (tipo === "sucesso" ? "mensagem-sucesso" : "mensagem-erro");
}

// Renderiza os cards e a tabela garantindo limpeza prévia
function renderizarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.innerHTML = "";

  let somaMediasGerais = 0;
  let quantDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let contadorBomDesempenho = 0;
  let contadorAtencao = 0;

  disciplinasAtuais.forEach((item, index) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);

    const faltasLista = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisciplina = somarFaltas(faltasLista);
    totalFaltasGeral += totalFaltasDisciplina;

    let situacaoTexto = "Nota ainda não disponível";
    let classeSituacao = "situacao-indisponivel";

    if (media !== null) {
      somaMediasGerais += media;
      quantDisciplinasComMedia++;

      if (media >= 6.0) {
        situacaoTexto = "Bom desempenho";
        classeSituacao = "situacao-bom";
        contadorBomDesempenho++;
      } else {
        situacaoTexto = "Atenção";
        classeSituacao = "situacao-atencao";
        contadorAtencao++;
      }
    }

    const tr = document.createElement("tr");

    // Coluna 1: Nome da disciplina (seguro contra XSS via textContent)
    const tdNome = document.createElement("td");
    const strongNome = document.createElement("strong");
    strongNome.textContent = item.disciplina;
    tdNome.appendChild(strongNome);
    tr.appendChild(tdNome);

    if (!modoEdicao) {
      // Modo Leitura
      const td1 = document.createElement("td");
      td1.textContent = formatarNotaExibicao(n1);
      tr.appendChild(td1);

      const td2 = document.createElement("td");
      td2.textContent = formatarNotaExibicao(n2);
      tr.appendChild(td2);

      const td3 = document.createElement("td");
      td3.textContent = formatarNotaExibicao(n3);
      tr.appendChild(td3);

      const tdMedia = document.createElement("td");
      const strongMedia = document.createElement("strong");
      strongMedia.textContent = formatarNotaExibicao(media);
      tdMedia.appendChild(strongMedia);
      tr.appendChild(tdMedia);

      const tdFaltas = document.createElement("td");
      tdFaltas.textContent = totalFaltasDisciplina;
      tr.appendChild(tdFaltas);

      const tdSituacao = document.createElement("td");
      tdSituacao.className = classeSituacao;
      tdSituacao.textContent = situacaoTexto;
      tr.appendChild(tdSituacao);
    } else {
      // Modo Edição de dados
      const f1 = faltasLista[0] !== undefined ? faltasLista[0] : 0;
      const f2 = faltasLista[1] !== undefined ? faltasLista[1] : 0;
      const f3 = faltasLista[2] !== undefined ? faltasLista[2] : 0;

      tr.innerHTML += `
        <td><input type="text" class="input-edicao" id="edit-tri1-${index}" value="${formatarNotaInput(n1)}"></td>
        <td><input type="text" class="input-edicao" id="edit-tri2-${index}" value="${formatarNotaInput(n2)}"></td>
        <td><input type="text" class="input-edicao" id="edit-tri3-${index}" value="${formatarNotaInput(n3)}"></td>
        <td><strong>${formatarNotaExibicao(media)}</strong></td>
        <td>
          <input type="text" class="input-edicao" style="width:35px" id="edit-f1-${index}" value="${f1}">
          <input type="text" class="input-edicao" style="width:35px" id="edit-f2-${index}" value="${f2}">
          <input type="text" class="input-edicao" style="width:35px" id="edit-f3-${index}" value="${f3}">
        </td>
        <td class="${classeSituacao}">${situacaoTexto}</td>
      `;
    }

    corpoTabela.appendChild(tr);
  });

  // Atualização segura dos cards de resumo
  const cardMedia = document.getElementById("card-media");
  const cardFaltas = document.getElementById("card-faltas");
  const cardBom = document.getElementById("card-bom-desempenho");
  const cardAtencao = document.getElementById("card-atencao");
  const cardFreq = document.getElementById("card-frequencia");

  const mediaGeralGlobal = quantDisciplinasComMedia > 0 ? (somaMediasGerais / quantDisciplinasComMedia) : null;

  if (cardMedia) cardMedia.textContent = formatarNotaExibicao(mediaGeralGlobal);
  if (cardFaltas) cardFaltas.textContent = totalFaltasGeral;
  if (cardBom) cardBom.textContent = contadorBomDesempenho;
  if (cardAtencao) cardAtencao.textContent = contadorAtencao;
  if (cardFreq) cardFreq.textContent = FREQUENCIA_DEMONSTRATIVA;
}

// Autenticação na API via PIN
async function autenticar() {
  const campoPin = document.getElementById("campo-pin");
  const pinDigitado = campoPin ? campoPin.value.trim() : "";

  if (!pinDigitado) {
    exibirMensagem("Digite o PIN para entrar.");
    return;
  }

  exibirMensagem("Conectando...", "sucesso");

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      exibirMensagem("Turma, chamada ou PIN inválidos.");
      return;
    }

    if (resposta.status === 429) {
      exibirMensagem("Muitas tentativas. Aguarde um minuto e tente novamente.");
      return;
    }

    if (!resposta.ok) {
      exibirMensagem("Não foi possível conectar ao servidor. Tente novamente.");
      return;
    }

    const json = await resposta.json();

    // Guarda o PIN apenas na memória da sessão atual
    pinSessao = pinDigitado;

    // Limpa o campo do PIN por segurança
    if (campoPin) campoPin.value = "";

    // Aplica regra dos dados: API > LOCAIS
    if (json && json.dados && Array.isArray(json.dados.disciplinas)) {
      disciplinasAtuais = json.dados.disciplinas;
    } else {
      disciplinasAtuais = JSON.parse(JSON.stringify(dadosDisciplinasLocais));
    }

    // Esconde a área de acesso e mostra o conteúdo do boletim
    document.getElementById("area-login").style.display = "none";
    document.getElementById("conteudo-boletim").style.display = "block";
    exibirMensagem("");

    renderizarBoletim();

  } catch (erro) {
    exibirMensagem("Não foi possível conectar ao servidor. Tente novamente.");
  }
}

// Validação dos dados digitados na edição
function validarNotaInput(valStr) {
  if (valStr === null || valStr === undefined) return { valida: true, valor: null };
  const str = valStr.toString().trim().replace(",", ".");
  if (str === "") return { valida: true, valor: null };

  const num = Number(str);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valida: false, valor: null };
  }
  return { valida: true, valor: num };
}

function validarFaltaInput(valStr) {
  if (valStr === null || valStr === undefined) return { valida: false, valor: null };
  const str = valStr.toString().trim();
  if (str === "") return { valida: false, valor: null };

  const num = Number(str);
  if (isNaN(num) || !Number.isInteger(num) || num < 0) {
    return { valida: false, valor: null };
  }
  return { valida: true, valor: num };
}

// Ativação do modo de edição
function ativarEdicao() {
  modoEdicao = true;
  document.getElementById("btn-alterar-dados").style.display = "none";
  document.getElementById("btn-salvar-dados").style.display = "inline-block";
  document.getElementById("btn-cancelar-edicao").style.display = "inline-block";
  renderizarBoletim();
}

// Cancelamento do modo de edição
function cancelarEdicao() {
  modoEdicao = false;
  document.getElementById("btn-alterar-dados").style.display = "inline-block";
  document.getElementById("btn-salvar-dados").style.display = "none";
  document.getElementById("btn-cancelar-edicao").style.display = "none";
  exibirMensagem("");
  renderizarBoletim();
}

// Salvamento das alterações na API
async function salvarAlteracoes() {
  let temErro = false;
  const novasDisciplinas = [];

  disciplinasAtuais.forEach((item, index) => {
    const el1 = document.getElementById(`edit-tri1-${index}`);
    const el2 = document.getElementById(`edit-tri2-${index}`);
    const el3 = document.getElementById(`edit-tri3-${index}`);
    const elF1 = document.getElementById(`edit-f1-${index}`);
    const elF2 = document.getElementById(`edit-f2-${index}`);
    const elF3 = document.getElementById(`edit-f3-${index}`);

    const res1 = validarNotaInput(el1 ? el1.value : "");
    const res2 = validarNotaInput(el2 ? el2.value : "");
    const res3 = validarNotaInput(el3 ? el3.value : "");

    const resF1 = validarFaltaInput(elF1 ? elF1.value : "");
    const resF2 = validarFaltaInput(elF2 ? elF2.value : "");
    const resF3 = validarFaltaInput(elF3 ? elF3.value : "");

    // Destaca campos com erro visualmente
    [ [el1, res1], [el2, res2], [el3, res3], [elF1, resF1], [elF2, resF2], [elF3, resF3] ].forEach(([el, res]) => {
      if (el) {
        if (!res.valida) {
          el.classList.add("input-invalido");
          temErro = true;
        } else {
          el.classList.remove("input-invalido");
        }
      }
    });

    novasDisciplinas.push({
      disciplina: item.disciplina,
      tri1: res1.valor,
      tri2: res2.valor,
      tri3: res3.valor,
      faltas: [
        resF1.valida ? resF1.valor : 0,
        resF2.valida ? resF2.valor : 0,
        resF3.valida ? resF3.valor : 0
      ]
    });
  });

  if (temErro) {
    exibirMensagem("Por favor, corrija os valores destacados em vermelho.");
    return;
  }

  exibirMensagem("Salvando...", "sucesso");

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      exibirMensagem("Erro ao salvar dados no servidor. Tente novamente.");
      return;
    }

    disciplinasAtuais = novasDisciplinas;
    modoEdicao = false;

    document.getElementById("btn-alterar-dados").style.display = "inline-block";
    document.getElementById("btn-salvar-dados").style.display = "none";
    document.getElementById("btn-cancelar-edicao").style.display = "none";

    renderizarBoletim();
    exibirMensagem("Dados salvos com sucesso.", "sucesso");

  } catch (erro) {
    exibirMensagem("Não foi possível conectar ao servidor. Tente novamente.");
  }
}

// Configuração dos eventos da página
document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar = document.getElementById("btn-entrar");
  if (btnEntrar) btnEntrar.addEventListener("click", autenticar);

  const campoPin = document.getElementById("campo-pin");
  if (campoPin) {
    campoPin.addEventListener("keypress", (e) => {
      if (e.key === "Enter") autenticar();
    });
  }

  const btnAlterar = document.getElementById("btn-alterar-dados");
  if (btnAlterar) btnAlterar.addEventListener("click", ativarEdicao);

  const btnSalvar = document.getElementById("btn-salvar-dados");
  if (btnSalvar) btnSalvar.addEventListener("click", salvarAlteracoes);

  const btnCancelar = document.getElementById("btn-cancelar-edicao");
  if (btnCancelar) btnCancelar.addEventListener("click", cancelarEdicao);
});