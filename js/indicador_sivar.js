let rawData = [];
let bairrosUnicos = new Set();

// Inicializa mapa de marcadores
const markerMap = L.map('markerMap').setView([-7.23, -35.88], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(markerMap);
let markerClusterGroup = L.markerClusterGroup({maxClusterRadius: 10}).addTo(markerMap);

const icons = {
    'Recuperação de Veículo': L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', iconSize:[25,25]})
};

// Função para atualizar o mapa, caso utilize algum filtro.
function updateMap() {
    const daysAgo = parseInt(document.getElementById('periodSelect').value, 10);
    const selectedTypes = Array.from(document.querySelectorAll('.crime-filter:checked')).map(cb => cb.value);
    const bairrosSelecionados = Array.from(document.getElementById('bairroSelect').selectedOptions).map(opt => opt.value);
    const hora = Array.from(document.getElementById('hourSelect').selectedOptions).map(opt => opt.value);
    const dia = Array.from(document.getElementById('daySelect').selectedOptions).map(opt => opt.value);

    // Dados filtrados
    let filtered;
    let filterBairro;
    let filterHora;
    let filterDia;
    let filterDiaHora;

    // Data Base - no conjunto de dados, a última data que teve registro foi no dia 25/04/2025, por isso ficou fixado nela
    let baseDate = new Date("2025-04-25"); 
    
    // Tratamento de todos os Filtros
    if (daysAgo === 0) {
        filtered = rawData;
        filterBairro = rawData;
        filterHora = rawData;
        filterDia = rawData;
        filterDiaHora = rawData;
    } else {
        const cutoff = new Date(baseDate.getTime() - daysAgo * 86400000);
        filtered = rawData.filter(d => new Date(d.despachado) >= cutoff);
        filterBairro = rawData.filter(d => new Date(d.despachado) >= cutoff);
        filterHora = rawData.filter(d => new Date(d.despachado) >= cutoff);
        filterDia = rawData.filter(d => new Date(d.despachado) >= cutoff);
        filterDiaHora = rawData.filter(d => new Date(d.despachado) >= cutoff);
    }

    if (!bairrosSelecionados.includes('todos')) {
        filtered = filtered.filter(d => bairrosSelecionados.includes(d.bairro));
        filterHora = filterHora.filter(d => bairrosSelecionados.includes(d.bairro));
        filterDia = filterDia.filter(d => bairrosSelecionados.includes(d.bairro));
        filterDiaHora = filterDiaHora.filter(d => bairrosSelecionados.includes(d.bairro));
    }

    if (!hora.includes('todos')) {
        const horaSelecionada = selectHora.value;
        const horaNum = Number(horaSelecionada);
        filtered = filtered.filter(d => hora.includes(String(d.hora_exata)));
        filterBairro = filterBairro.filter(d => hora.includes(String(d.hora_exata)));
        filterDia = filterDia.filter(d => hora.includes(String(d.hora_exata)));
    }

    if (!dia.includes('todos')) {
        filtered = filtered.filter(d => dia.includes(d.dia_da_semana));
        filterBairro = filterBairro.filter(d => dia.includes(d.dia_da_semana));
        filterHora = filterHora.filter(d => dia.includes(d.dia_da_semana));
    }
    // Tratamento de todos os Filtros

    // Envia para o gráfico os filtros para atualizar
    enviarDadosParaGrafico(filtered);

    // Preenchimento dos dados no mapa
    markerClusterGroup.clearLayers();
    filtered
    .filter(d => selectedTypes.includes(d.tipo))
    .forEach(d => {
        const marker = L.marker([d.latitude, d.longitude], { icon: icons[d.tipo] })
            // Pop-up dos marcadores
            .bindPopup(
                `<strong>Tipo:</strong> ${d.tipo}<br>` +
                `<strong>Bairro:</strong> ${d.bairro}<br>` +
                `<strong>Data:</strong> ${new Date(d.despachado).toLocaleString()}`
            );
        markerClusterGroup.addLayer(marker);
    });
    // Preenchimento dos dados no mapa

    // Contagem do total dos registros, após filtros
    filtered = filtered.filter(d => selectedTypes.includes(d.tipo));

    // Envia para gráfico de bairros, após filtro dos tipos 
    filterBairro = filterBairro.filter(d => selectedTypes.includes(d.tipo));
    enviarDadosParaGraficoBairro(filterBairro);

    // Envia para gráfico de horas
    filterHora = filterHora.filter(d => selectedTypes.includes(d.tipo));
    enviarDadosParaGraficoHoras(filterHora);

    // Envia para gráfico de dia da semana
    filterDia = filterDia.filter(d => selectedTypes.includes(d.tipo));
    enviarDadosParaGraficoDia(filterDia);

    // Envia para gráfico dia e Hora
    filterDiaHora = filterDiaHora.filter(d => selectedTypes.includes(d.tipo));
    enviarDadosParaGraficoDiaHora(filterDiaHora);

    const divTotalFiltros = document.getElementById("divTotal");
    const total = filtered.length;

    if (total === 0) {
        divTotalFiltros.innerHTML = "<em>Nenhum registro.</em>";
        return;
    }
    
    const percentual = ((total / rawData.length) * 100).toFixed(1);
    
    let valorFiltrado = `<strong>Total de registros:</strong> ${total} (${percentual}%)<br>`;
    divTotalFiltros.innerHTML = valorFiltrado;
    // Contagem do total dos registros, após filtros
}


// Preenchimento dos bairros automáticamente
function preencherSelectBairros() {
  const select = document.getElementById('bairroSelect');
  const bairrosOrdenados = [...bairrosUnicos].sort();

  bairrosOrdenados.forEach(bairro => {
    const option = document.createElement('option');
    option.value = bairro;
    option.textContent = bairro;
    select.appendChild(option);
  });
}
// Preenchimento dos bairros automáticamente

// Apresentação bairros selecionados
const bairroSelect = document.getElementById('bairroSelect');
const displayBairros = document.getElementById('bairrosSelecionados');

function atualizarBairrosSelecionados() {
    const selecionados = Array.from(bairroSelect.selectedOptions).map(opt => opt.value);
    if (selecionados.includes('todos')) {
        displayBairros.textContent = 'Todos os bairros selecionados.';
    } else {
        displayBairros.textContent = 'Bairro(s) selecionados: ' + selecionados.join(', ');
    }
}
bairroSelect.addEventListener('change', atualizarBairrosSelecionados);
atualizarBairrosSelecionados();
// Apresentação bairros selecionados

function enviarDadosParaGrafico(filtered) {
    const iframe = document.getElementById('tiposFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(filtered, '*');
    }
}

function enviarDadosParaGraficoBairro(filtered) {
    const iframe = document.getElementById('bairrosFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(filtered, '*');
    }
}

function enviarDadosParaGraficoHoras(filtered) {
    const iframe = document.getElementById('horaFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(filtered, '*');
    }
}

function enviarDadosParaGraficoDia(filtered) {
    const iframe = document.getElementById('diaFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(filtered, '*');
    }
}

function enviarDadosParaGraficoDiaHora(filtered) {
    const iframe = document.getElementById('diaHoraFrame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(filtered, '*');
    }
}

fetch('../json/sivar.json')
    .then(res => res.json())
    .then(data => {
    rawData = data;

    rawData.forEach(d => {
      if (d.bairro) {
        bairrosUnicos.add(d.bairro);
      }
    });
    preencherSelectBairros();
    updateMap();
    });

document.getElementById('periodSelect').addEventListener('change', updateMap);
document.querySelectorAll('.crime-filter').forEach(cb => cb.addEventListener('change', updateMap));
document.getElementById('bairroSelect').addEventListener('change', updateMap);
document.getElementById('hourSelect').addEventListener('change', updateMap);
document.getElementById('daySelect').addEventListener('change', updateMap);