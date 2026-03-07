// google-maps-integration.js - MÓDULO DE INTEGRACIÓN DE GOOGLE MAPS
// Este módulo proporciona funcionalidad para mostrar mapas de Google Maps
// cuando se selecciona una provincia en el formulario de publicación

// =====================================================
// COORDENADAS DE PROVINCIAS PARA GOOGLE MAPS
// =====================================================
const provinceCoordinates = {
    'Panamá': {
        lat: 8.9824,
        lng: -79.5199,
        zoom: 11,
        label: 'Provincia de Panamá'
    },
    'Panamá Oeste': {
        lat: 8.8833,
        lng: -79.7000,
        zoom: 11,
        label: 'Provincia de Panamá Oeste'
    },
    'Colón': {
        lat: 9.3212,
        lng: -79.8864,
        zoom: 10,
        label: 'Provincia de Colón'
    },
    'Chiriquí': {
        lat: 8.4281,
        lng: -82.4318,
        zoom: 10,
        label: 'Provincia de Chiriquí'
    },
    'Veraguas': {
        lat: 8.2881,
        lng: -80.7846,
        zoom: 9,
        label: 'Provincia de Veraguas'
    },
    'Coclé': {
        lat: 8.6784,
        lng: -80.2829,
        zoom: 10,
        label: 'Provincia de Coclé'
    },
    'Los Santos': {
        lat: 7.7589,
        lng: -80.4331,
        zoom: 10,
        label: 'Provincia de Los Santos'
    },
    'Herrera': {
        lat: 7.8833,
        lng: -80.6167,
        zoom: 10,
        label: 'Provincia de Herrera'
    },
    'Darién': {
        lat: 7.6997,
        lng: -77.8086,
        zoom: 8,
        label: 'Provincia de Darién'
    },
    'Bocas del Toro': {
        lat: 9.3333,
        lng: -82.2500,
        zoom: 10,
        label: 'Provincia de Bocas del Toro'
    }
};

// =====================================================
// COORDENADAS DE DISTRITOS PRINCIPALES
// =====================================================
const districtCoordinates = {
    'Panamá': {
        'Panamá': { lat: 8.9824, lng: -79.5199, zoom: 13 },
        'San Miguelito': { lat: 9.0500, lng: -79.4667, zoom: 13 },
        'Arraiján': { lat: 8.9500, lng: -79.6333, zoom: 13 },
        'Capira': { lat: 8.7833, lng: -79.8000, zoom: 12 },
        'Chame': { lat: 8.6333, lng: -79.8833, zoom: 12 },
        'La Chorrera': { lat: 8.8833, lng: -79.7833, zoom: 13 },
        'Cerro Punta': { lat: 9.1333, lng: -79.4833, zoom: 13 }
    },
    'Panamá Oeste': {
        'La Chorrera': { lat: 8.8833, lng: -79.7833, zoom: 13 },
        'Capira': { lat: 8.7833, lng: -79.8000, zoom: 12 },
        'Chame': { lat: 8.6333, lng: -79.8833, zoom: 12 },
        'Arraiján': { lat: 8.9500, lng: -79.6333, zoom: 13 },
        'San Carlos': { lat: 8.8833, lng: -79.9333, zoom: 12 }
    },
    'Colón': {
        'Colón': { lat: 9.3212, lng: -79.8864, zoom: 13 },
        'Portobelo': { lat: 9.5500, lng: -79.6500, zoom: 12 },
        'Chagres': { lat: 9.2333, lng: -80.0833, zoom: 11 },
        'Donoso': { lat: 9.1000, lng: -80.4000, zoom: 11 },
        'Gatún': { lat: 9.2667, lng: -79.6500, zoom: 12 },
        'Margarita': { lat: 9.3167, lng: -79.9833, zoom: 11 },
        'Santa Isabel': { lat: 9.4833, lng: -79.7333, zoom: 12 }
    },
    'Chiriquí': {
        'David': { lat: 8.4281, lng: -82.4318, zoom: 13 },
        'Bugaba': { lat: 8.4833, lng: -82.2000, zoom: 12 },
        'Renacimiento': { lat: 8.6667, lng: -82.8167, zoom: 11 },
        'Barú': { lat: 8.3167, lng: -82.8667, zoom: 12 },
        'Boquete': { lat: 8.7833, lng: -82.2500, zoom: 13 },
        'Alanje': { lat: 8.5667, lng: -82.5500, zoom: 12 },
        'Tierras Altas': { lat: 8.8500, lng: -82.7000, zoom: 12 }
    },
    'Veraguas': {
        'Santiago': { lat: 8.1000, lng: -80.9833, zoom: 13 },
        'Atalaya': { lat: 8.2333, lng: -80.9167, zoom: 12 },
        'Mariato': { lat: 7.9667, lng: -81.1333, zoom: 11 },
        'Montijo': { lat: 8.3333, lng: -81.5500, zoom: 11 },
        'La Mesa': { lat: 8.0833, lng: -80.7167, zoom: 12 },
        'San Francisco': { lat: 8.1667, lng: -80.8833, zoom: 12 },
        'Soná': { lat: 7.9333, lng: -81.3167, zoom: 12 }
    },
    'Coclé': {
        'Penonomé': { lat: 8.6784, lng: -80.2829, zoom: 13 },
        'Aguadulce': { lat: 8.2500, lng: -80.4167, zoom: 13 },
        'Natá': { lat: 8.3333, lng: -80.2833, zoom: 12 },
        'Olá': { lat: 8.6667, lng: -80.0333, zoom: 12 },
        'Antón': { lat: 8.4833, lng: -80.2667, zoom: 12 },
        'La Pintada': { lat: 8.5833, lng: -80.1333, zoom: 12 }
    },
    'Los Santos': {
        'Las Tablas': { lat: 7.7589, lng: -80.4331, zoom: 13 },
        'Los Santos': { lat: 7.9167, lng: -80.4167, zoom: 12 },
        'Guararé': { lat: 7.7833, lng: -80.2833, zoom: 12 },
        'Macaracas': { lat: 7.7500, lng: -80.5500, zoom: 11 },
        'Pedasí': { lat: 7.5333, lng: -80.1167, zoom: 12 },
        'Pocrí': { lat: 7.7000, lng: -80.2833, zoom: 11 },
        'Tonosí': { lat: 7.4833, lng: -80.3000, zoom: 11 }
    },
    'Herrera': {
        'Chitré': { lat: 7.8833, lng: -80.6167, zoom: 13 },
        'Las Minas': { lat: 7.9833, lng: -80.7000, zoom: 11 },
        'Los Pozos': { lat: 7.9333, lng: -80.8167, zoom: 11 },
        'Ocú': { lat: 7.8500, lng: -80.8500, zoom: 11 },
        'Parita': { lat: 7.9667, lng: -80.5500, zoom: 12 },
        'Pesé': { lat: 7.9333, lng: -80.4667, zoom: 12 },
        'Santa María': { lat: 7.9000, lng: -80.3667, zoom: 12 }
    },
    'Darién': {
        'La Palma': { lat: 7.6997, lng: -77.8086, zoom: 12 },
        'Chepigana': { lat: 7.5167, lng: -77.8667, zoom: 11 },
        'Pinogana': { lat: 8.1333, lng: -77.5833, zoom: 10 },
        'Santa Fe': { lat: 8.2500, lng: -77.9667, zoom: 11 },
        'Garachiné': { lat: 7.8000, lng: -77.3667, zoom: 11 },
        'Wargandí': { lat: 8.1333, lng: -77.7500, zoom: 10 }
    },
    'Bocas del Toro': {
        'Bocas del Toro': { lat: 9.3333, lng: -82.2500, zoom: 13 },
        'Changuinola': { lat: 9.4333, lng: -82.5167, zoom: 12 },
        'Almirante': { lat: 9.2833, lng: -82.4000, zoom: 13 },
        'Chiriquí Grande': { lat: 9.0833, lng: -82.1500, zoom: 12 }
    }
};

// Tu API Key de Google Maps
const MAPS_API_KEY = 'AIzaSyBijfhc6uDfEfzAreBjH_tJpYpc1yDvFas';

class GoogleMapsIntegration {
    constructor() {
        this.map = null;
        this.marker = null;
        this.geocoder = null;
        this.isLoaded = false;
        this.mapContainer = null;
    }

    /**
     * Cargar la API de Google Maps de forma asíncrona
     * @returns {Promise} - Promesa que se resuelve cuando la API está cargada
     */
    async loadMapsAPI() {
        if (this.isLoaded) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (window.google && window.google.maps) {
                this.isLoaded = true;
                this.initServices();
                resolve();
                return;
            }

            // Cargar el script de Google Maps
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&language=es`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                this.isLoaded = true;
                this.initServices();
                resolve();
            };

            script.onerror = (error) => {
                console.error('Error cargando Google Maps API:', error);
                reject(new Error('Error al cargar Google Maps API'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Inicializar los servicios de Google Maps
     */
    initServices() {
        if (window.google && window.google.maps) {
            this.geocoder = new window.google.maps.Geocoder();
        }
    }

    /**
     * Inicializar el mapa en un contenedor específico
     * @param {string} containerId - ID del elemento HTML donde se mostrará el mapa
     * @param {object} options - Opciones de inicialización del mapa
     */
    initMap(containerId, options = {}) {
        if (!this.isLoaded) {
            console.error('Google Maps API no está cargada');
            return;
        }

        this.mapContainer = document.getElementById(containerId);
        if (!this.mapContainer) {
            console.error(`Contenedor del mapa no encontrado: ${containerId}`);
            return;
        }

        const defaultCenter = { lat: 8.9824, lng: -79.5199 }; // Panamá por defecto
        const mapOptions = {
            center: options.center || defaultCenter,
            zoom: options.zoom || 10,
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: true,
            gestureHandling: 'greedy'
        };

        this.map = new window.google.maps.Map(this.mapContainer, mapOptions);
        
        // Agregar control de cerrar
        this.addCloseControl();
        
        return this.map;
    }

    /**
     * Agregar botón de cerrar al mapa
     */
    addCloseControl() {
        if (!this.map) return;

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.className = 'map-close-btn';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        `;

        closeButton.addEventListener('click', () => {
            this.hideMap();
        });

        this.map.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(closeButton);
    }

    /**
     * Mostrar el mapa con la ubicación de una provincia específica
     * @param {string} provinceName - Nombre de la provincia
     */
    showProvinceOnMap(provinceName) {
        if (!this.isLoaded || !this.map) {
            console.error('Mapa no inicializado');
            return;
        }

        const provinceData = provinceCoordinates[provinceName];
        if (!provinceData) {
            console.warn(`No se encontraron coordenadas para: ${provinceName}`);
            return;
        }

        // Centrar el mapa en la provincia
        const newCenter = { lat: provinceData.lat, lng: provinceData.lng };
        this.map.setCenter(newCenter);
        this.map.setZoom(provinceData.zoom);

        // Eliminar marcador anterior si existe
        if (this.marker) {
            this.marker.setMap(null);
        }

        // Crear nuevo marcador
        this.marker = new window.google.maps.Marker({
            position: newCenter,
            map: this.map,
            title: provinceData.label || provinceName,
            animation: window.google.maps.Animation.DROP,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#00bfae',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3
            }
        });

        // Agregar info window
        const infoWindow = new window.google.maps.InfoWindow({
            content: `
                <div style="padding: 8px; max-width: 200px;">
                    <strong style="color: #00bfae;">${provinceData.label || provinceName}</strong>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #666;">
                        Lat: ${provinceData.lat.toFixed(4)}, Lng: ${provinceData.lng.toFixed(4)}
                    </p>
                </div>
            `
        });

        this.marker.addListener('click', () => {
            infoWindow.open(this.map, this.marker);
        });

        // Mostrar el mapa
        this.showMap();
    }

    /**
     * Mostrar el mapa con la ubicación de un distrito específico
     * @param {string} provinceName - Nombre de la provincia
     * @param {string} districtName - Nombre del distrito
     */
    showDistrictOnMap(provinceName, districtName) {
        if (!this.isLoaded || !this.map) {
            console.error('Mapa no inicializado');
            return;
        }

        const districtsData = districtCoordinates[provinceName];
        if (!districtsData || !districtsData[districtName]) {
            console.warn(`No se encontraron coordenadas para: ${districtName} en ${provinceName}`);
            return;
        }

        const districtData = districtsData[districtName];

        // Centrar el mapa en el distrito
        const newCenter = { lat: districtData.lat, lng: districtData.lng };
        this.map.setCenter(newCenter);
        this.map.setZoom(districtData.zoom);

        // Eliminar marcador anterior si existe
        if (this.marker) {
            this.marker.setMap(null);
        }

        // Crear nuevo marcador
        this.marker = new window.google.maps.Marker({
            position: newCenter,
            map: this.map,
            title: districtName,
            animation: window.google.maps.Animation.DROP,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#00bfae',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3
            }
        });

        // Agregar info window
        const infoWindow = new window.google.maps.InfoWindow({
            content: `
                <div style="padding: 8px; max-width: 200px;">
                    <strong style="color: #00bfae;">${districtName}</strong>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #666;">
                        ${provinceName}<br>
                        Lat: ${districtData.lat.toFixed(4)}, Lng: ${districtData.lng.toFixed(4)}
                    </p>
                </div>
            `
        });

        this.marker.addEventListener('click', () => {
            infoWindow.open(this.map, this.marker);
        });

        // Mostrar el mapa
        this.showMap();
    }

    /**
     * Mostrar el contenedor del mapa
     */
    showMap() {
        if (this.mapContainer) {
            this.mapContainer.style.display = 'block';
            this.mapContainer.classList.add('map-visible');
            
            // Actualizar tamaño del mapa
            if (this.map) {
                window.google.maps.event.trigger(this.map, 'resize');
            }
        }
    }

    /**
     * Ocultar el contenedor del mapa
     */
    hideMap() {
        if (this.mapContainer) {
            this.mapContainer.style.display = 'none';
            this.mapContainer.classList.remove('map-visible');
        }
    }

    /**
     * Destruir el mapa y limpiar recursos
     */
    destroy() {
        if (this.marker) {
            this.marker.setMap(null);
            this.marker = null;
        }
        if (this.map) {
            this.map = null;
        }
        this.geocoder = null;
        this.isLoaded = false;
    }

    /**
     * Obtener la ubicación actual del usuario
     * @returns {Promise} - Promesa con las coordenadas
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('La geolocalización no está soportada en este navegador'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    let errorMessage = 'Error desconocido';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Permiso de ubicación denegado. Por favor permite el acceso a tu ubicación.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'No se pudo obtener la ubicación. Verifica tu conexión.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    /**
     * Mostrar la ubicación actual del usuario en el mapa
     * @param {Function} onLocationFound - Callback cuando se encuentra la ubicación
     */
    async showCurrentLocation(onLocationFound) {
        try {
            // Cargar la API si no está cargada
            if (!this.isLoaded) {
                await this.loadMapsAPI();
                this.initMap('province-map', { zoom: 15 });
                this.isLoaded = true;
            }

            const coords = await this.getCurrentLocation();

            // Centrar el mapa
            this.map.setCenter(coords);
            this.map.setZoom(15);

            // Eliminar marcador anterior
            if (this.marker) {
                this.marker.setMap(null);
            }

            // Crear marcador de ubicación actual
            this.marker = new window.google.maps.Marker({
                position: coords,
                map: this.map,
                title: 'Tu ubicación actual',
                animation: window.google.maps.Animation.DROP,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 15,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3
                }
            });

            // Info window
            const infoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding: 8px; max-width: 200px;">
                        <strong style="color: #4285F4;">📍 Tu ubicación actual</strong>
                        <p style="margin: 5px 0 0; font-size: 12px; color: #666;">
                            Lat: ${coords.lat.toFixed(6)}<br>
                            Lng: ${coords.lng.toFixed(6)}
                        </p>
                    </div>
                `
            });

            this.marker.addListener('click', () => {
                infoWindow.open(this.map, this.marker);
            });

            // Mostrar el mapa
            this.showMap();

            // Ejecutar callback si existe
            if (onLocationFound) {
                onLocationFound(coords);
            }

            return coords;
        } catch (error) {
            console.error('Error al obtener ubicación:', error);
            throw error;
        }
    }
}

// Instancia singleton para usar en toda la aplicación
const mapsIntegration = new GoogleMapsIntegration();

// Exportar para uso en otros módulos
export default mapsIntegration;
export { GoogleMapsIntegration, provinceCoordinates };
