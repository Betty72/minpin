const paths = {
  apiBaseUrl: '/{api}/{apiVersion}/',
  apiStatisticsBaseUrl: '/statistics/api/',
  apiStatisticsGraphqlUrl: '/statistics/v2018/graphql/',
  apiLiveOccurrenceBaseUrl: '/liveoccurrence/{apiVersion}/',
  apiLiveOccurrencePushUrl: '/liveoccurrence/{apiVersion}/',
  apiRetailOperatorBaseUrl: '/retail-operator-api/v0/',
  apiNonCachedBaseUrl: '/{api}/{apiVersion}/',
  apiAuthBaseUrl: '/{api}/{apiVersion}/',
  pushUrl: '',
  apiPIAUrl: '/pia/api/v2/cache/',
  apiPerfTrackingUrl: '/perf/performance/track',
  apiSupportUrl: '/support/api/',
  featureTogglesBaseUrl: '',
  translationS3BaseURL: '/touch',
};

window.addEventListener('message', async (event) => {
  if (event.data.type === 'getClientDataRequest') {
    window.postMessage({
      type: 'getClientDataResponse',
      payload: {
        version: window._kc?.version,
        offering: window._kc?.offering,
      },
    });
  }

  if (event.data.type === 'loadClientRequest') {
    const script = document.createElement('script');
    const {
      static,
      offering,
      version,
      release,
      foggles,
      search,
    } = event.data.payload;
    const endpoint = `https://${static}/client`;

    if (!offering) {
      return;
    }

    script.src = version
      ? `${endpoint}/${offering}/${version}/js/kambi-bootstrap.js?${search}`
      : `${endpoint}/${offering}/kambi-bootstrap.js?${search}`;

    const data = await fetch(
      'https://catalog.services.kambi.com/m_client_api_config.json'
    )
      .then((response) => response.json())
      .catch(() => false);

    window._kc = {
      ...(window._kc || {}),
      featureTogglesBaseUrl: `https://${foggles}`,
      offering, //unibet sets this manually so have to be overriden
    };

    if (data && release) {
      const url = (key) =>
        `${data.release[key]}${paths[key]}`;

      window._kc = {
        ...window._kc,
        apiBaseUrl: url('apiBaseUrl'),
        apiStatisticsBaseUrl: url('apiStatisticsBaseUrl'),
        apiStatisticsGraphqlUrl: url(
          'apiStatisticsGraphqlUrl'
        ),
        apiLiveOccurrenceBaseUrl: url(
          'apiLiveOccurrenceBaseUrl'
        ),
        apiLiveOccurrencePushUrl: url(
          'apiLiveOccurrencePushUrl'
        ),
        apiNonCachedBaseUrl: url('apiNonCachedBaseUrl'),
        apiAuthBaseUrl: url('apiAuthBaseUrl'),
        pushUrl: url('pushUrl'),
        apiPIAUrl: url('apiPIAUrl'),
        apiPerfTrackingUrl: url('apiPerfTrackingUrl'),
        apiSupportUrl: url('apiSupportUrl'),
        apiRetailOperatorBaseUrl: url(
          'apiRetailOperatorBaseUrl'
        ),
      };
    }

    if (static.includes('-static')) {
      window._kc = {
        ...window._kc,
        baseUrl: `${endpoint}/${offering}/`,
        coreFilesUrl: `${endpoint}/core/`,
        fontsUrl: `${endpoint}/core/fonts/2/`,
      };
    }

    document.body.appendChild(script);

    // unsuccessfull attempt to solve issue with napoleon games that the client is hidden on startpage
    // setTimeout(() => {
    //   window.postMessage(
    //     {
    //       type: `widget.from.setClientShow`,
    //     },
    //     location.protocol + '//' + location.host
    //   );
    // }, 10000);
  }
});
