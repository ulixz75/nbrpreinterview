const CACHE_NAME = 'luxurystay-cache-v1';
const URLS_TO_CACHE = [
  '/',
  'index.html',
  // Si tuvieras archivos CSS o JS externos, los añadirías aquí:
  // 'styles.css',
  // 'app.js',
  'icon-192x192.png',
  'icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Evento de instalación: se dispara cuando el SW se instala por primera vez.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Evento de activación: se dispara después de la instalación.
// Se usa para limpiar cachés antiguas.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


// Evento fetch: se dispara cada vez que la aplicación solicita un recurso (página, imagen, etc.)
// Estrategia: "Cache First" (primero busca en caché, si no, va a la red)
self.addEventListener('fetch', event => {
  // No interceptar peticiones a Unsplash para que siempre carguen las imágenes
  if (event.request.url.includes('unsplash.com')) {
    return;
  }
    
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en caché, lo devuelve desde ahí.
        if (response) {
          return response;
        }
        
        // Si no, lo pide a la red.
        return fetch(event.request).then(
          networkResponse => {
            // Y si lo obtiene, lo guarda en caché para la próxima vez.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !networkResponse.type.includes('cors')) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
      })
      .catch(() => {
        // Opcional: podrías devolver una página de "estás offline" si falla la red
        // y el recurso no está en caché.
      })
  );
});