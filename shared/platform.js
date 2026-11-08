/* AuthorChe game platform. Games run locally without advertising or telemetry. */
(function (w, d) {
  'use strict';
  const Audio = w.AudioBufferSourceNode;
  if (Audio && Audio.prototype) {
    if (!Audio.prototype.noteOn) Audio.prototype.noteOn = Audio.prototype.start;
    if (!Audio.prototype.noteOff) Audio.prototype.noteOff = Audio.prototype.stop;
  }
  if (w.HTMLMediaElement) {
    const play = w.HTMLMediaElement.prototype.play, waiting = new Set();
    w.HTMLMediaElement.prototype.play = function () {
      const media = this, result = play.call(media);
      if (!result || !result.catch) return result;
      return result.catch(function (error) {
        if (error.name !== 'NotAllowedError') throw error;
        waiting.add(media);
      });
    };
    function unlock() { waiting.forEach(function (media) { play.call(media)?.catch(function () {}); }); waiting.clear(); }
    d.addEventListener('pointerdown', unlock);
    d.addEventListener('keydown', unlock);
  }
  const noop = function () {};
  const ready = function () { return Promise.resolve(); };
  const rewarded = function (callback) {
    if (typeof callback === 'function') callback();
    return Promise.resolve(true);
  };
  const finish = function (callbacks) {
    if (callbacks && typeof callbacks.adFinished === 'function') callbacks.adFinished();
  };
  w.RufflePlayer = w.RufflePlayer || {};
  w.RufflePlayer.config = {allowScriptAccess: false, openUrlMode: 'deny', showRuffleLogo: false, contextMenu: 'off', splashScreen: false};
  function suppressed(value) {
    const url = String(value && value.url || value || '');
    return /(?:config\.uca\.cloud\.unity3d|cdp\.cloud\.unity3d|api\.uca\.cloud\.unity3d|stats\.unity3d|perf-events\.cloud\.unity3d|gameanalytics\.com|google-analytics|googletagmanager|cloudflareinsights|recordsession\.php|unitygame\.herokuapp\.com\/bitlife\/transfer|mochibot\.com|swfstats\.com|ngads\.com|kongregate\.com\/flash\/API_|itch\.io\/html-callback|game\.y2013\.com\/loaded\/|ninjakiwi\.com\/(?:nklogin|Games\/NewsFeed|btd5\/scripts)|sockjs-node|nitrome\.com\/ajax\/v1\/|t\.y8\.com\/log)/i.test(url);
  }
  function offlineResponse(value) {
    const url = String(value && value.url || value || '');
    if (/\.swf(?:[?#]|$)/i.test(url)) {
      const movie = new Uint8Array([70,87,83,9,16,0,0,0,8,0,0,12,1,0,0,0]);
      return new Response(movie, {status: 200, headers: {'Content-Type': 'application/x-shockwave-flash'}});
    }
    return new Response('{}', {status: 200, headers: {'Content-Type': 'application/json'}});
  }
  const nativeFetch = w.fetch;
  if (nativeFetch) w.fetch = function (input, options) {
    if (suppressed(input)) return Promise.resolve(offlineResponse(input));
    return nativeFetch.call(this, input, options);
  };
  if (w.XMLHttpRequest) {
    const open = w.XMLHttpRequest.prototype.open, send = w.XMLHttpRequest.prototype.send;
    w.XMLHttpRequest.prototype.open = function (method, url) {
      this.acSuppressed = suppressed(url);
      if (this.acSuppressed) return open.call(this, 'GET', 'data:application/json,%7B%7D', true);
      return open.apply(this, arguments);
    };
    w.XMLHttpRequest.prototype.send = function (body) { return send.call(this, this.acSuppressed ? null : body); };
  }
  const beacon = navigator.sendBeacon;
  if (beacon) navigator.sendBeacon = function (url, data) { return suppressed(url) ? true : beacon.call(this, url, data); };
  w.PokiSDK = {
    init: ready, initWithVideoback: ready, setDebug: noop, setDebugTouchOverlayController: noop,
    gameLoadingStart: noop, gameLoadingProgress: noop, gameLoadingFinished: noop,
    gameplayStart: noop, gameplayStop: noop, happyTime: noop, customEvent: noop,
    commercialBreak: ready, rewardedBreak: rewarded, displayAd: noop, destroyAd: noop,
    isAdBlocked: function () { return false; }, getURLParam: function () { return ''; },
    shareableURL: function () { return Promise.resolve(w.location.href); },
    getLanguage: function () { return (navigator.language || 'en').split('-')[0]; },
    muteAd: noop, setPlayerAge: noop, adBlocked: false
  };
  const crazy = {
    init: ready,
    ad: {requestAd: function (_, callbacks) { finish(callbacks); return Promise.resolve(); }, hasAdblock: function () { return Promise.resolve(false); }},
    game: {gameplayStart: noop, gameplayStop: noop, happytime: noop, loadingStart: noop, loadingStop: noop, inviteLink: function () { return w.location.href; }},
    user: {isUserAccountAvailable: false, getUser: function () { return Promise.resolve(null); }}
  };
  w.CrazyGames = {SDK: crazy, CrazySDK: {getInstance: function () { return crazy; }}};
  // SDKs are supplied locally; prevent legacy engines from injecting another copy.
  if (d.head && d.createElement && !d.getElementById('gamedistribution-jssdk')) {
    const marker = d.createElement('meta');
    marker.id = 'gamedistribution-jssdk';
    d.head.appendChild(marker);
  }
  let gdOptions = w.GD_OPTIONS, gdAnnounced;
  Object.defineProperty(w, 'GD_OPTIONS', {
    configurable: true,
    get: function () { return gdOptions; },
    set: function (options) {
      gdOptions = options;
      Promise.resolve().then(function () { gdEvent('SDK_READY'); });
    }
  });
  function gdEvent(name) {
    const options = w.GD_OPTIONS;
    if (!options || typeof options.onEvent !== 'function') return;
    if (name === 'SDK_READY') {
      if (gdAnnounced === options) return;
      gdAnnounced = options;
    }
    options.onEvent({name: name});
  }
  w.gdsdk = {
    AdType: {Rewarded: 'rewarded', Interstitial: 'interstitial'},
    showAd: function () { gdEvent('SDK_GAME_START'); return Promise.resolve(); },
    preloadAd: ready, openConsole: noop, cancelAd: noop,
    showBanner: ready, getSession: function () { return Promise.resolve({}); }
  };
  w.GameDistribution = w.gdsdk;
  w.adsbygoogle = {push: noop};
  w.ga = noop;
  w.gtag = noop;
  w.GameAnalytics = new Proxy(function () {}, {get: function () { return noop; }, apply: noop});
  w.GameAnalyticsSDK = {GameAnalytics: w.GameAnalytics};
  w.cmgAdBreak = function () {
    if (typeof w.cmgAdBreakCallBack === 'function') w.cmgAdBreakCallBack();
    return Promise.resolve();
  };
  w.adBreak = function (options) {
    if (!options) return;
    if (typeof options.beforeAd === 'function') options.beforeAd();
    if (typeof options.adViewed === 'function') options.adViewed();
    if (typeof options.afterAd === 'function') options.afterAd();
    if (typeof options.adBreakDone === 'function') options.adBreakDone({breakStatus: 'notReady'});
  };
  w.adConfig = noop;
  w.gmsoft = {showInterstitial: ready, showReward: rewarded};
  w.sdk = w.sdk || {showBanner: noop, showInterstitial: ready, showReward: rewarded};
  w.open = function () { return null; };
  d.addEventListener('click', function (event) {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    try {
      const url = new URL(link.href, w.location.href);
      if (url.origin !== w.location.origin) event.preventDefault();
    } catch (_) { event.preventDefault(); }
  }, true);
  let startupFailed = false;
  function announce(type, reason) {
    if (w.parent !== w) w.parent.postMessage({type: type, reason: reason, source: 'authorche-game'}, '*');
  }
  w.addEventListener('load', function () { gdEvent('SDK_READY'); if (!startupFailed) announce('ac-game-loaded'); });
  w.addEventListener('error', function (event) {
    if (event.message) { startupFailed = true; announce('ac-game-error', /webgl/i.test(event.message) ? 'webgl' : undefined); }
  });
  d.addEventListener('webglcontextcreationerror', function () {
    const probe = d.createElement('canvas');
    let context;
    try { context = probe.getContext('webgl2') || probe.getContext('webgl'); } catch (_) {}
    if (context) {
      const release = context.getExtension('WEBGL_lose_context');
      if (release) release.loseContext();
      return;
    }
    startupFailed = true;
    announce('ac-game-error', 'webgl');
  }, true);
  d.addEventListener('visibilitychange', function () {
    // Browser runtimes pause their animation callbacks in background tabs.
    if (d.hidden) {
      d.querySelectorAll('audio,video').forEach(function (media) { media.pause(); });
      w.dispatchEvent(new Event('blur'));
    }
  });
})(window, document);

