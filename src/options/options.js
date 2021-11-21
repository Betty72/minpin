let offerings = [];
const form = document.querySelector('form');
const autofillElm = document.querySelector('#autofill');
const offeringElm = document.querySelector('#offering');
const versionElm = document.querySelector('#version');
const releaseElm = document.querySelector('#release');
const staticElm = document.querySelector('#static');
const fogglesElm = document.querySelector('#foggles');
const outputElm = document.querySelector('#output');
const catalogUrl =
  'https://catalog.services.kambi.com/bettingclient_catalog.yml';
const releaseInfoUrl =
  'https://catalog.services.kambi.com/m_client_api_config.json';
const paths = {
  apiBaseUrl: '/{api}/{apiVersion}/',
  apiStatisticsBaseUrl: '/statistics/api/',
  apiStatisticsGraphqlUrl: '/statistics/v2018/graphql/',
  apiLiveOccurrenceBaseUrl: '/liveoccurrence/{apiVersion}/',
  apiLiveOccurrencePushUrl: '/liveoccurrence/{apiVersion}/',
  apiNonCachedBaseUrl: '/{api}/{apiVersion}/',
  apiAuthBaseUrl: '/{api}/{apiVersion}/',
  pushUrl: '',
  apiPIAUrl: '/pia/api/v2/cache/',
  apiPerfTrackingUrl: '/perf/performance/track',
  apiSupportUrl: '/support/api/',
};

const getState = () =>
  chrome.extension.getBackgroundPage().getState();

const setState = (item) =>
  chrome.extension.getBackgroundPage().setState(item);

const reloadContent = () => {
  window.close();
  chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {
      chrome.tabs.reload(tabs[0].id);
    }
  );
};

const loadReleaseApiConfig = () =>
  fetch(releaseInfoUrl)
    .then((response) => response.json())
    .then((data) =>
      Object.keys(paths).reduce(
        (prev, key) => ({
          ...prev,
          [key]: `${data.release[key]}${paths[key]}`,
        }),
        {}
      )
    )
    .catch(() => false);

const loadOfferings = async () => {
  const offerings = [];

  const catalog = await fetch(catalogUrl)
    .then((response) => response.text())
    .catch(() => '');

  let regex =
    /destination_path: \/opt\/cdn\/sb-mobileclient\/([^\n]*)/g;

  while ((match = regex.exec(catalog))) {
    offerings.push(match[1]);
  }

  return offerings;
};

const updateSpotlightSearch = () => {
  const wrapper = document.createElement('div');

  if (offeringElm.value.length > 0) {
    offerings
      .filter((offering) =>
        offering.includes(offeringElm.value)
      )
      .forEach((offering) => {
        const element = document.createElement('button');

        element.innerText = offering;
        element.type = 'button';
        element.addEventListener(
          'click',
          () => {
            offeringElm.value = offering;
            offeringElm.focus();
          },
          false
        );
        wrapper.appendChild(element);
      });
  }

  outputElm.innerHTML = '';

  // if last suggestion is same as input do not show it
  if (wrapper.innerText !== offeringElm.value) {
    outputElm.appendChild(wrapper);
  }
};

offeringElm.addEventListener(
  'keyup',
  updateSpotlightSearch
);
offeringElm.addEventListener(
  'focus',
  updateSpotlightSearch
);
offeringElm.addEventListener('blur', () => {
  setTimeout(() => {
    outputElm.innerHTML = '';
  }, 30);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const releaseApiConfig = releaseElm.checked
    ? await loadReleaseApiConfig()
    : undefined;

  setState({
    offering: offeringElm.value,
    version: versionElm.value,
    static: staticElm.value,
    foggles: fogglesElm.value,
    release: releaseElm.checked,
    releaseApiConfig,
  });
  reloadContent();
});
form.addEventListener('reset', () => {
  setState({
    offering: '',
    version: '',
    static: '',
    foggles: '',
    release: false,
    releaseApiConfig: undefined,
  });
  reloadContent();
});

autofillElm.addEventListener('click', () => {
  chrome.extension
    .getBackgroundPage()
    .requestClientData((message) => {
      const { offering, version } = message.payload;

      switch (!false) {
        case !offeringElm.value && !versionElm.value:
          offeringElm.value = offering || '';
          versionElm.value = version || '';
          break;
        case !!offeringElm.value && !!versionElm.value:
          offeringElm.value = '';
          versionElm.value = '';
          break;
        default:
          offeringElm.value =
            offeringElm.value || offering || '';
          versionElm.value =
            versionElm.value || version || '';
          break;
      }
    });
});

(async () => {
  const { offering, version, release, static, foggles } =
    getState();

  offerings = await loadOfferings();

  offeringElm.value = offering;
  versionElm.value = version;
  releaseElm.checked = !!release;

  if (static) {
    staticElm.value = static;
  } else {
    staticElm.options[0].selected = true;
  }
  if (foggles) {
    fogglesElm.value = foggles;
  } else {
    fogglesElm.options[0].selected = true;
  }
})();
