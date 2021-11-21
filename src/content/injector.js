// load content scripts that has access to the pages actuall DOM
chrome.runtime
  .getManifest()
  .web_accessible_resources.filter((resource) =>
    resource.endsWith('.js')
  )
  .forEach((resource) => {
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL(resource);
    const parent =
      document.head || document.documentElement;
    parent.appendChild(script);
  });

// proxy messages between background and content script
chrome.runtime.onMessage.addListener(
  ({ type, payload }, _, sendResponse) => {
    switch (type) {
      case 'getClientDataRequest':
        const cb = (event) => {
          if (event.data.type === 'getClientDataResponse') {
            sendResponse(event.data);
            window.removeEventListener('message', cb);
          }
        };
        window.addEventListener('message', cb);
        window.postMessage(
          { type: 'getClientDataRequest' },
          location.origin
        );
        return true;
      case 'loadClientRequest':
        window.postMessage(
          {
            type: 'loadClientRequest',
            payload,
          },
          location.origin
        );
        break;
    }
  }
);
