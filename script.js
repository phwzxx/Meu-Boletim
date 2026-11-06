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