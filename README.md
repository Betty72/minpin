Docs: https://confluence.services.kambi.com/display/APEX/redir-ext

Content script is injected into the current DOM of each tab by the Injector script (in src/content)

Inject script is added to sandbox of each tab by manifest as "content_script", it is used to inject content script and proxy messages between content script and background script. (Injected content script escapes sandbox)

Background script is shared between tabs and added by manifest as "background". It is used to react on tab load and complete events and on request of kambi-bootstrap.js. It replaces integration scripts use of kambi-bootstrap.js with customised requests.

Customisation of \_kc-object and issued of by-passed kambi-bootstrap.js is done in Content script when requested by background script.

Options scripts are used to customise the extension. It used background script to manage storage and proxy message to get state from tab content script.
