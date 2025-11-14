// ===============================
// ARQUIVO: script.js (VERSÃO FINAL CORRIGIDA)
// ===============================

// ID da planilha principal
const SHEET_ID = "14ief5dGshoyk7moisNLPrHjkImzyQbomYV6qP48qNBk";
const GUIA_UNICA = "CertificadosFonte";

// URL DO WEB APP (LOG DE DOWNLOAD)
const WEB_APP_LOG_URL = "https://script.google.com/macros/s/AKfycbxhKAoVk9fNZ1dw3IE26WDTgO5nKKTLwglwCWEdvk17PQJTHxQDUfwL9tvW275GfQO5Gw/exec";


// Função utilitária: limpa o texto para comparação
const limparTexto = texto =>
  String(texto || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();


// =======================================================
// 📌 FUNÇÃO PARA CARREGAR A GUIA CertificadosFonte
// =======================================================
async function carregarDadosPlanilha() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${GUIA_UNICA}&v=${Date.now()}`;

    const resposta = await fetch(url);
    const texto = await resposta.text();

    const linhas = texto.split("\n").slice(1).filter(l => l.trim() !== "");

    return linhas.map(linha => {
      const colunas = linha
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map(c => c.replace(/^"|"$/g, "").trim());

      return {
        numero_ccpj: colunas[1] || "",
        nome_completo: colunas[2] || "",
        nome_curso: colunas[3] || "",
        instituicao_filial: colunas[4] || "",
        url_pdf: colunas[5] || ""
      };
    });

  } catch (err) {
    console.error("Erro ao carregar planilha:", err);
    return [];
  }
}


// =======================================================
// 🔥 REGISTRA DOWNLOAD + ABRE PDF (INCLUÍDO O CCPJ!!!)
// =======================================================
function registrarDownload(nomeCompleto, nomeCurso, instituicao, urlPdf, numeroCcpj) {

  fetch(WEB_APP_LOG_URL, {
    method: "POST",
    mode: "no-cors",
    body: new URLSearchParams({
      nomeCompleto,
      nomeCurso,
      instituicao,
      urlPdf,
      numeroCcpj
    }),
  })
    .then(() => window.open(urlPdf, "_blank"))
    .catch(() => window.open(urlPdf, "_blank"));
}



// =======================================================
// 🌐 EVENTO PRINCIPAL
// =======================================================
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("formBuscaCertificado");
  const areaPrevia = document.getElementById("areaPrevia");
  const mensagem = document.getElementById("mensagem");

  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();

      areaPrevia.classList.add("hidden");
      mensagem.classList.add("hidden");

      const nomeBusca = limparTexto(document.getElementById("nomeCompleto").value);

      if (!nomeBusca) {
        mostrarMensagem("Por favor, digite o nome completo.", true);
        return;
      }

      const dados = await carregarDadosPlanilha();

      const encontrados = dados.filter(
        c => limparTexto(c.nome_completo) === nomeBusca && c.url_pdf
      );

      if (encontrados.length > 0) {
        mostrarPreviaCertificados(encontrados);
      } else {
        mostrarMensagem(null, false);
      }
    });
  }


  // =======================================================
  // 📄 MOSTRAR A PRÉVIA DOS CERTIFICADOS
  // =======================================================
  function mostrarPreviaCertificados(certificados) {
    let html = "<h2>Confirme Seu(s) Certificado(s)</h2>";
    let linksHtml = "";

    certificados.forEach((cert, i) => {
      html += `
        <div class="certificado-previa">
          <p><strong>Nº CCPJ:</strong> ${cert.numero_ccpj}</p>
          <p><strong>Nome:</strong> ${cert.nome_completo}</p>
          <h4>Certificado ${i + 1}: ${cert.nome_curso}</h4>
          <p><strong>Instituição:</strong> ${cert.instituicao_filial}</p>
        </div>
        ${i < certificados.length - 1 ? "<hr>" : ""}
      `;

      linksHtml += `
        <a href="javascript:void(0)"
           onclick="registrarDownload(
              '${cert.nome_completo.replace(/'/g, "\\'")}',
              '${cert.nome_curso.replace(/'/g, "\\'")}',
              '${cert.instituicao_filial.replace(/'/g, "\\'")}',
              '${cert.url_pdf}',
              '${cert.numero_ccpj}'
            )"
           class="btn-principal btn-sim link-download"
           style="display:block;margin-bottom:10px;text-align:center;">
            📄 Sim, Ver Certificado ${i + 1}
        </a>
      `;
    });

    html += `
      <div class="confirma-acao">
        <h3>Seu(s) certificado(s) está(ão) correto(s)?</h3>
        <div id="linksContainer">${linksHtml}</div>

        <button id="btnCorrigir" class="btn-principal btn-secundario">
          Não, Preciso Corrigir
        </button>
      </div>
    `;

    areaPrevia.innerHTML = html;
    areaPrevia.classList.remove("hidden");

    document.getElementById("btnCorrigir")
      .addEventListener("click", () => mostrarMensagem(null, false));
  }



  // =======================================================
  // ⚠️ MENSAGENS DE ERRO OU ORIENTAÇÃO
  // =======================================================
  function mostrarMensagem(msg, isError) {
    areaPrevia.classList.add("hidden");

    const texto = msg || `
      <p>Seu certificado não foi encontrado ou está incorreto.</p>
      <p>Compareça à Secretaria da Juventude (SEMJUV) para correção.</p>
      <p><strong>Horário:</strong> Segunda a Sexta, 8h30 às 17h00.</p>
    `;

    mensagem.innerHTML = texto;
    mensagem.style.backgroundColor = isError ? "#f8d7da" : "#fff3cd";
    mensagem.style.color = isError ? "#721c24" : "#856404";
    mensagem.classList.remove("hidden");

    document.getElementById("nomeCompleto").value = "";
  }
});
