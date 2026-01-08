const CACHE_VERSION = 'v2.1';
const CACHE_NAME = `portfolio-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './assets/css/main.css',
    './assets/css/background.css',
    './assets/css/animations.css',
    './assets/css/responsive.css',
    './assets/css/carousel-responsive.css',
    './assets/css/modals.css',
    './assets/css/modal-links.css',
    './assets/css/social-links.css',
    './assets/css/loader.css',
    './assets/js/animations.js',
    './assets/js/particles.js',
    './assets/js/skills-stats.js',
    './assets/js/skill-bars-animation.js',
    './assets/js/projects-carousel.js',
    './assets/js/modals.js',
    './assets/js/grainHeight.js',
    './assets/js/loader-messages.js',
    './assets/js/loader.js',
    './assets/js/hash-reset.js',
    './assets/js/lanyard.js',
    './assets/js/language.js',
    './assets/js/parallax.js',
    './assets/js/nav-scroll.js',
    './assets/img/logo.png',
    './assets/img/mii.png'
];

self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installation', CACHE_NAME);
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Mise en cache des assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.startsWith('chrome-extension') || event.request.url.includes('extension') || !(event.request.url.indexOf('http') === 0)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            console.log('[ServiceWorker] Récupération depuis le cache:', event.request.url);
                            return response;
                        }
                        // Si pas de cache non plus, retourner une erreur
                        return new Response('Contenu non disponible hors ligne', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activation', CACHE_NAME);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});
