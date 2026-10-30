const dadosDisciplinas = [
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

// Frequência fictícia/demonstrativa para esta etapa do projeto (será calculada dinamicamente no futuro)
const FREQUENCIA_DEMONSTRATIVA = "92%";

// Função para normalizar qualquer formato de nota na escala de 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Converte vírgula para ponto caso seja texto
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let numero = parseFloat(valor);

  if (isNaN(numero)) {
    return null;
  }

  // Ajusta notas maiores que 10 e menores ou iguais a 100 (ex: 82 vira 8.2)
  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  // Verifica se a nota está dentro do intervalo válido de 0 a 10
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  return null;
}

// Função para formatar a nota para exibição no HTML (ex: 8.5 vira "8,5")
function formatarNotaExibicao(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

// Função para calcular a média de uma lista de notas disponíveis
function calcularMedia(notas) {
  const notasValidas = notas.filter(n => n !== null);
  if (notasValidas.length === 0) return null;

  const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
  return soma / notasValidas.length;
}

// Função para somar as faltas dos trimestres
function somarFaltas(faltasArray) {
  return faltasArray.reduce((acc, curr) => acc + curr, 0);
}

// Função principal que constrói a tabela e atualiza os cards
function renderizarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.innerHTML = "";

  let somaMediasGerais = 0;
  let quantDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let contadorBomDesempenho = 0;
  let contadorAtencao = 0;

  dadosDisciplinas.forEach(item => {
    // Normaliza as notas dos trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const totalFaltasDisciplina = somarFaltas(item.faltas);
    totalFaltasGeral += totalFaltasDisciplina;

    // Define a situação da disciplina
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

    // Cria a linha da tabela via DOM
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarNotaExibicao(n1)}</td>
      <td>${formatarNotaExibicao(n2)}</td>
      <td>${formatarNotaExibicao(n3)}</td>
      <td><strong>${formatarNotaExibicao(media)}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${classeSituacao}">${situacaoTexto}</td>
    `;

    corpoTabela.appendChild(tr);
  });

  // Atualiza os Cards de Resumo no DOM
  const mediaGeralGlobal = quantDisciplinasComMedia > 0 ? (somaMediasGerais / quantDisciplinasComMedia) : null;
  
  document.getElementById("card-media").innerText = formatarNotaExibicao(mediaGeralGlobal);
  document.getElementById("card-faltas").innerText = totalFaltasGeral;
  document.getElementById("card-bom-desempenho").innerText = contadorBomDesempenho;
  document.getElementById("card-atencao").innerText = contadorAtencao;
  document.getElementById("card-frequencia").innerText = FREQUENCIA_DEMONSTRATIVA;
}

// Executa a função assim que a página carrega
document.addEventListener("DOMContentLoaded", renderizarBoletim);