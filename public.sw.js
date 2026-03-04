importScripts('/scram/scramjet.all.js');

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker({
    debug: true,
    compatibility: {
        prebundle: false
    }
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith((async () => {
        await scramjet.loadConfig({
            prefix: '/proxy/',
            codec: 'plain',
            bundle: '/scram/scramjet.all.js'
        });
        
        if (scramjet.route(event)) {
            return scramjet.fetch(event);
        }
        
        return fetch(event.request);
    })());
});
