const urls = [
  './',
  './manifest.webmanifest',
  './favicon.svg',
  './background.jpg',
  './event.ics',
  './map.jpg',
  './image.jpg',

  // './Mukta/style.css',
  // './Mukta/Mukta-latin-400.woff2',
  // './Mukta/Mukta-latin-700.woff2',
  // './Mukta/Mukta-latin-800.woff2',

  './VarelaRound-Regular/style.css',
  './VarelaRound-Regular/VarelaRound-Regular.woff2',

  './Josefin_Sans/style.css',
  './Josefin_Sans/Josefin_Sans-latin-100-700.woff2',
  './Josefin_Sans/Josefin_Sans-latin-italic-100-700.woff2',

  './map.pmtiles',
  './pmtiles/pmtiles.mjs',
  './pmtiles/maplibre-gl.css',
  './pmtiles/maplibre-gl.mjs',
  './pmtiles/protomaps-themes-base.mjs',

  './pmtiles/Noto%20Sans%20Regular/0-255.pbf',
  './pmtiles/Noto%20Sans%20Regular/256-511.pbf',
  './pmtiles/Noto%20Sans%20Regular/65024-65279.pbf',
  './pmtiles/Noto%20Sans%20Medium/0-255.pbf',
  './pmtiles/Noto%20Sans%20Italic/0-255.pbf',
  './pmtiles/Noto%20Sans%20Italic/65280-65535.pbf',
];

self.addEventListener('fetch', (event) => {
  //console.log('SERVICE-WORKER: Request: ' + event.request.url);
  event.respondWith(
    caches.match(event.request).then(async (response) => {
      if (response) {

        // Range responses are returned as-is
        if (response.status == 206) {
          console.log('SERVICE-WORKER: Pass-through range response as-is: ' + event.request.url);
          return response;
        }

        // Range request header
        const rangeHeader = event.request.headers.get('range');
        if (rangeHeader) {
          // Consume 'bytes=' prefix, only operate on the first range if there are multiple, parse ranges to values
          const range = (rangeHeader.trim().toLowerCase().split('=').pop().trim().split(',')[0].trim()+'-').split('-').slice(0, 2).map(v => v.length ? parseInt(v, 10) : null);

          console.log('SERVICE-WORKER: Constructing range response (' + range[0] + '-' + range[1] + '): ' + event.request.url);

          // Original response
          const responseBlob = await response.blob();

          // Calculate range
          let end = range[1] === null ? responseBlob.size : range[1] + 1; // Inclusive end range
          let start = range[0] === null ? responseBlob.size - end : range[0];
          if ((end !== null && end > responseBlob.size) || (start !== null && start < 0)) {
            return new Response('', { status: 416, statusText: 'Range Not Satisfiable', });
          }

          // Create range response
          const rangeBlob = responseBlob.slice(start, end);
          const rangeResponse = new Response(rangeBlob, { status: 206, statusText: 'Partial Content', headers: response.headers });
          rangeResponse.headers.set('Content-Length', String(rangeBlob.size));
          rangeResponse.headers.set('Content-Range', `bytes ${start}-${end - 1}/` + `${responseBlob.size}`);
          return rangeResponse;
        }

        console.log('SERVICE-WORKER: Respond from cache: ' + event.request.url);
        return response;
      } else {
        console.log('SERVICE-WORKER: Respond with fetch: ' + event.request.url);
        return await fetch(event.request);
      }
    })
  );
});

self.addEventListener('install', function (event) {
  console.log('SERVICE-WORKER: Installing version: ' + cacheName);
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      //return cache.addAll(urls)
      return Promise.all(
        Array.from(urls.values()).map(function(url) {
          const actualUrl = url + '?' + cacheName;    // Prevent cache
          const request = new Request(actualUrl, {credentials: 'same-origin'});
          return fetch(request).then(function(response) {
            if (!response.ok) {
                throw new Error('Request for ' + url + ' had status ' + response.status);
            }
            return cache.put(url, response);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', function (event) {
  console.log('SERVICE-WORKER: Activating version: ' + cacheName);
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(keyList.map(function (key, i) {
        if (key !== cacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
});

const cacheName = 'v2025-03-25-16-30-00' /* STRING TO BE UPDATED AFTER ANY CONTENT CHANGES */