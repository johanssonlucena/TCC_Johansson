let rawData = [];
let bairrosUnicos = new Set();

// Inicializa mapa de marcadores
const markerMap = L.map('markerMap').setView([-7.23, -35.88], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(markerMap);
let markerClusterGroup = L.markerClusterGroup({maxClusterRadius: 0}).addTo(markerMap);

const icons = {
    'Homicídio doloso': L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', iconSize:[30,30]}),
    'Latrocínio': L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', iconSize:[30,30]}),
    'Feminicídio': L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png', iconSize:[35,35]}),
    'Morte decorrente de Confronto Policial': L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png', iconSize:[35,35]})
};

function updateMap() {
    const daysAgo = parseInt(document.getElementById('periodSelect').value, 10);
    const selectedTypes = Array.from(document.querySelectorAll('.crime-filter:checked')).map(cb => cb.value);
    const bairroSelecionado = document.getElementById('bairroSelect').value;
    const hora = document.getElementById('hourSelect').value;
    const dia = document.getElementById('daySelect').value;

    let filtered;

    if (daysAgo === 0) {
        filtered = rawData;
    } else {
        const cutoff = new Date(1745550000000 - daysAgo * 86400000);
        filtered = rawData.filter(d => new Date(d.despachado) >= cutoff);
    }

    if (bairroSelecionado !== 'todos') {
        filtered = filtered.filter(d => d.bairro === bairroSelecionado);
    }

    if (hora !== 'todos') {
        const horaSelecionada = selectHora.value;
        const horaNum = Number(horaSelecionada);
        filtered = filtered.filter(d => d.hora_exata === horaNum);
    }

    if (dia !== 'todos') {
        filtered = filtered.filter(d => d.dia_da_semana === dia);
    }

    markerClusterGroup.clearLayers();
    filtered
    .filter(d => selectedTypes.includes(d.tipo))
    .forEach(d => {
        const marker = L.marker([d.latitude, d.longitude], { icon: icons[d.tipo] })
            .bindPopup(
                `<strong>Tipo:</strong> ${d.tipo}<br>` +
                `<strong>Bairro:</strong> ${d.bairro}<br>` +
                `<strong>Data:</strong> ${new Date(d.despachado).toLocaleString()}`
            );
        markerClusterGroup.addLayer(marker);
    });
}

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

fetch('../json/cvli.json')
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