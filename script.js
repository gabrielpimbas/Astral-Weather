// registro do service workers - 1 parte
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")

      .then(() => {
        console.log("Service Worker registrado com sucesso.");
      })

      .catch((erro) => {
        console.error("Erro ao registrar o Service Worker:", erro);
      });
  });
}
// urls das APIs - 2 parte
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const CLIMA_URL = "https://api.open-meteo.com/v1/forecast";

// elementos do html - 3 parte
const campoCidade = document.getElementById("cidade");
const botaoBuscar = document.getElementById("buscar");
const resultado = document.getElementById("resultado");

// clicar no botão - 4 parte
botaoBuscar.addEventListener("click", buscarClima);

// pesquisar com enter - Melhoria 1 - 5 parte
campoCidade.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    buscarClima();
  }
});

// função principal - 6 parte
function buscarClima() {
  const cidade = campoCidade.value.trim();

  // campo vazio
  if (cidade === "") {
    resultado.innerHTML = `
      <p class="mensagem">
        Digite uma cidade.
      </p>
    `;

    return;
  }
  // mostra mensagem de busca
  resultado.innerHTML = `
    <p class="mensagem">
      Buscando...
    </p>
  `;

  // mostra a cidade digitada no console
  console.log("Cidade digitada:", cidade);

  // link da busca da cidade
  const urlCidade =
    `${GEO_URL}?name=${encodeURIComponent(cidade)}` +
    `&count=1&language=pt&format=json`;

  console.log("Link para buscar a cidade:");
  console.log(urlCidade);

  // primeira requisição
  fetch(urlCidade)
    .then(function (resposta) {
      if (!resposta.ok) {
        throw new Error("Erro ao buscar cidade.");
      }

      return resposta.json();
    })

    .then(function (dadosCidade) {
      console.log("Dados da cidade:");
      console.log(dadosCidade);

      // verifica se encontrou a cidade
      if (!dadosCidade.results || dadosCidade.results.length === 0) {
        throw new Error("Cidade não encontrada.");
      }

      const local = dadosCidade.results[0];

      const latitude = local.latitude;
      const longitude = local.longitude;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);

      // link para pegar os dados do clima
      const urlClima =
        `${CLIMA_URL}?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code` +
        `&timezone=auto`;

      console.log("Link da API do clima:");
      console.log(urlClima);

      // segunda requisição
      return fetch(urlClima)
        .then(function (resposta) {
          if (!resposta.ok) {
            throw new Error("Erro ao buscar clima.");
          }

          return resposta.json();
        })

        .then(function (dadosClima) {
          // retorna os dados da cidade e do clima
          return {
            local: local,
            clima: dadosClima,
          };
        });
    })

    .then(function (dados) {
      console.log("JSON recebido da API:");
      console.log(dados.clima);

      const atual = dados.clima.current;
      const local = dados.local;

      // dados do clima
      const temperatura = atual.temperature_2m;
      const sensacao = atual.apparent_temperature;
      const umidade = atual.relative_humidity_2m;
      const vento = atual.wind_speed_10m;
      const codigo = atual.weather_code;
      const horario = atual.time;

      // deixa o horário mais fácil de ler 
      const horarioFormatado = horario.replace("T", " às ");

      // mostra os dados no console
      console.log("Temperatura:", temperatura);
      console.log("Sensação térmica:", sensacao);
      console.log("Umidade:", umidade);
      console.log("Vento:", vento);
      console.log("Código do clima:", codigo);
      console.log("Horário da atualização:", horario);

      // pega texto e emoji - melhoria 2
      const tempo = descobrirTempo(codigo);

      // localização
      const estado = local.admin1 || "";

      const pais = local.country || "";

      // resultado na tela
      resultado.innerHTML = `

        <div class="card-clima">

          <div class="icone">
            ${tempo.icone}
          </div>

          <h2>
            ${local.name}
          </h2>

          <p class="local">
            ${estado} - ${pais}
          </p>

          <p class="condicao">
            ${tempo.descricao}
          </p>

          <p>
            Temperatura:
            <strong>
              ${temperatura} °C
            </strong>
          </p>

          <p>
            Sensação:
            <strong>
              ${sensacao} °C
            </strong>
          </p>

          <p>
            Umidade:
            <strong>
              ${umidade}%
            </strong>
          </p>

          <p>
            Vento:
            <strong>
              ${vento} km/h
            </strong>
          </p>

          <p>
            Atualização:
            <strong>
              ${horarioFormatado}
            </strong>
          </p>

        </div>

      `;
    })

    // se der erro
    .catch(function (erro) {
      console.error("Erro:", erro);

      resultado.innerHTML = `

        <p class="mensagem">
          ${erro.message}
        </p>

      `;
    });
}

// transforma o código da api para mostrar o clima
function descobrirTempo(codigo) {
  // céu limpo
  if (codigo === 0) {
    return {
      descricao: "Céu limpo",
      icone: "☀️",
    };
  }

  // nublado
  if (codigo === 1 || codigo === 2 || codigo === 3) {
    return {
      descricao: "Nublado",
      icone: "☁️",
    };
  }

  // nevoeiro
  if (codigo === 45 || codigo === 48) {
    return {
      descricao: "Nevoeiro",
      icone: "🌫️",
    };
  }

  // chuva
  if (codigo >= 51 && codigo <= 82) {
    return {
      descricao: "Chuva",
      icone: "🌧️",
    };
  }

  // tempestade
  if (codigo === 95 || codigo === 96 || codigo === 99) {
    return {
      descricao: "Tempestade",
      icone: "⛈️",
    };
  }

  // caso não reconheça
  return {
    descricao: "Tempo variável",
    icone: "🌤️",
  };
}
