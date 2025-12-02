const map = L.map('map').setView([50, 10], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const visitedGroup = L.markerClusterGroup();

const visitedIcon = L.divIcon({
    className: 'heart-marker visited',
    html: '❤',
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    popupAnchor: [0, -20]
});

async function loadCities() {
    try {
        const response = await fetch('data/cities.json');
        const cities = await response.json();

        const enrichedCities = await Promise.all(
            cities.map(async (city) => {
                if (city.infoFile) {
                    const infoResponse = await fetch(city.infoFile);
                    const infoText = await infoResponse.text();
                    return { ...city, info: infoText.trim() };
                }
                return city;
            })
        );

        placeMarkers(enrichedCities);
    } catch (error) {
        console.error('Failed to load city data', error);
    }
}

function placeMarkers(cities) {
    cities.forEach((city) => {
        const label = city.visited || '';
        const marker = L.marker(city.coords, { icon: visitedIcon }).bindPopup(`<b>${city.name}</b><br>${label}`);
        marker.on('click', () => updateCityInfo(city));
        visitedGroup.addLayer(marker);
    });

    visitedGroup.addTo(map);
}

function updateCityInfo(city) {
    const visitedLabel = city.visited || '';
    const visitInfo = visitedLabel ? `<p class="meta">Visited: ${visitedLabel}</p>` : '';

    const formattedInfo = city.info
        ? city.info.split('\n').map((line) => line.trim() || '&nbsp;').join('<br>')
        : 'No details yet.';

    document.getElementById('city-info').innerHTML = `
        <h2>${city.name}</h2>
        ${visitInfo}
        <p>${formattedInfo}</p>
    `;
}

const galleryButton = document.getElementById('gallery-btn');
const galleryUrl = galleryButton.dataset.url;

galleryButton.addEventListener('click', () => {
    if (galleryUrl) {
        window.open(galleryUrl, '_blank', 'noopener');
    } else {
        alert('Add a gallery URL to the button\\\'s data-url attribute to open it here.');
    }
});

loadCities();
