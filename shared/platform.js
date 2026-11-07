/* AuthorChe game platform. Games run locally without advertising or telemetry. */
(function (w, d) {
  'use strict';
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
  function gdEvent(name) {
    const options = w.GD_OPTIONS;
    if (options && typeof options.onEvent === 'function') options.onEvent({name: name});
  }
  w.gdsdk = {
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
  function announce(type) {
    if (w.parent !== w) w.parent.postMessage({type: type, source: 'authorche-game'}, '*');
  }
  w.addEventListener('load', function () { gdEvent('SDK_READY'); announce('ac-game-loaded'); });
  w.addEventListener('error', function (event) {
    if (event.message) announce('ac-game-error');
  });
  d.addEventListener('visibilitychange', function () {
    // Browser runtimes pause their animation callbacks in background tabs.
    if (d.hidden) {
      d.querySelectorAll('audio,video').forEach(function (media) { media.pause(); });
      w.dispatchEvent(new Event('blur'));
    }
  });
})(window, document);
