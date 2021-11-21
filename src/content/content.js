window.addEventListener('message', async (event) => {
  switch (event.data.type) {
    case 'getClientDataRequest':
      window.postMessage({
        type: 'getClientDataResponse',
        payload: {
          version: window._kc?.version,
          offering: window._kc?.offering,
        },
      });
      break;
    case 'loadClientRequest':
      const script = document.createElement('script');
      const {
        static,
        offering,
        version,
        release,
        foggles,
        search,
        releaseApiConfig,
      } = event.data.payload;
      const endpoint = `https://${static}/client`;

      if (!offering) {
        return;
      }

      window._kc = {
        ...(window._kc || {}),
        featureTogglesBaseUrl: `https://${foggles}`,
        offering, //unibet sets this manually so have to be overriden
      };

      if (release && releaseApiConfig) {
        window._kc = {
          ...window._kc,
          ...releaseApiConfig,
        };
      }

      // currently we can not trust the variables to have been replaced in our test environments
      if (static.includes('-static')) {
        window._kc = {
          ...window._kc,
          baseUrl: `${endpoint}/${offering}/`,
          coreFilesUrl: `${endpoint}/core/`,
          fontsUrl: `${endpoint}/core/fonts/2/`,
        };
      }

      script.src = version
        ? `${endpoint}/${offering}/${version}/js/kambi-bootstrap.js?${search}`
        : `${endpoint}/${offering}/kambi-bootstrap.js?${search}`;

      document.body.appendChild(script);
      break;
  }
});

// unsuccessfull attempt to solve issue with napoleon games that the client is hidden on startpage
// setTimeout(() => {
//   window.postMessage(
//     {
//       type: `widget.from.setClientShow`,
//     },
//     location.protocol + '//' + location.host
//   );
// }, 10000);
