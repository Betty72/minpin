const loadedTabs = new Set();
const blockedTabs = new Map();

window.getState = () =>
  JSON.parse(localStorage.getItem('redir-ext') || '{}');

window.setState = (item) =>
  localStorage.setItem(
    'redir-ext',
    JSON.stringify({ ...getState(), ...item })
  );

window.requestClientData = (cb, payload = {}) => {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {
      if (!tabs.length) {
        console.warn('found no active tab');
        return;
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          type: 'getClientDataRequest',
          payload,
        },
        cb
      );
    }
  );
};

window.requestClientLoad = (tabId, search) => {
  blockedTabs.delete(tabId);
  chrome.tabs.sendMessage(tabId, {
    type: 'loadClientRequest',
    payload: {
      ...window.getState(),
      search: search.toString(),
    },
  });
};

// block calls to kambi-bootstrap if offering is set and query does not contain pass
// also requests content script to bootup the client instead
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { offering, static, version } = window.getState();

    if (!offering) {
      return {};
    }

    const { tabId, url, type } = details;
    const search = new URLSearchParams(new URL(url).search);

    // indicate that extension is acting on tab
    chrome.pageAction.setIcon({
      path: chrome.runtime.getURL(
        'src/images/icon_active.png'
      ),
      tabId,
    });

    if (search.has('pass')) {
      return {};
    }
    search.append('pass', true);

    // unibet makes a preflight to get data from bootstrap
    if (type === 'xmlhttprequest') {
      return {
        redirectUrl: version
          ? `https://${static}/client/${offering}/${version}/js/kambi-bootstrap.js?${search}`
          : `https://${static}/client/${offering}/kambi-bootstrap.js?${search}`,
      };
    }

    // tell content script to run if it has loaded, otherwice defer
    // unibet and seneca requires this even with run_at document_start specified in manifest
    if (loadedTabs.has(tabId)) {
      requestClientLoad(tabId, search);
    } else {
      blockedTabs.set(tabId, search);
    }

    return {
      cancel: true,
    };
  },
  {
    urls: ['*://*/*kambi-bootstrap.js*'],
    types: ['script', 'xmlhttprequest'],
  },
  ['blocking']
);

// drain sets and update pageAction for each tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  switch (changeInfo.status) {
    case 'loading':
      loadedTabs.delete(tabId);
      blockedTabs.delete(tabId);
      break;
    case 'complete':
      chrome.pageAction.show(tabId);
      loadedTabs.add(tabId);

      if (blockedTabs.has(tabId)) {
        requestClientLoad(tabId, blockedTabs.get(tabId));
      }
      break;
  }
});
