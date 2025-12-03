// Initialize Map
const map = L.map('map').setView([50, 10], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// --- INTERACTION LOGIC ---

// 1. Hide the bottom sheet when dragging the map (scrolling)
map.on('dragstart', () => {
    document.getElementById('info').classList.remove('active');
});

// 2. Hide the bottom sheet when clicking on the map background
map.on('click', () => {
    document.getElementById('info').classList.remove('active');
});

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
        const marker = L.marker(city.coords, { icon: visitedIcon });
        
        // We do NOT use .bindPopup() here so the default bubble doesn't appear.
        
        marker.on('click', (e) => {
            // Stop the map click event from firing (which would close the panel)
            L.DomEvent.stopPropagation(e);
            
            // 1. Update the content
            updateCityInfo(city);
            
            // 2. Center the map on the marker (optional, for better UX)
            map.flyTo(city.coords, map.getZoom());
        });
        
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

    // Update HTML
    const infoPanel = document.getElementById('info');
    document.getElementById('city-info').innerHTML = `
        <h2>${city.name}</h2>
        ${visitInfo}
        <p>${formattedInfo}</p>
    `;

    // Slide the panel up
    infoPanel.classList.add('active');
}

// Gallery Button Logic
const galleryButton = document.getElementById('gallery-btn');
if (galleryButton) {
    const galleryUrl = galleryButton.dataset.url;
    galleryButton.addEventListener('click', () => {
        if (galleryUrl) {
            window.open(galleryUrl, '_blank', 'noopener');
        } else {
            alert('Add a gallery URL to the button data-url attribute.');
        }
    });
}

loadCities();