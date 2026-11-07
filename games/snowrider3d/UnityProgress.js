/* AuthorChe loading UI for runtimes exposing Unity/Nitrome progress hooks. */
(function (w, d) {
  'use strict';
  let panel;
  function mount() {
    if (panel || !d.body) return;
    panel = d.createElement('div');
    panel.id = 'ac-runtime-loader';
    panel.setAttribute('role', 'status');
    panel.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#0b101b;color:#e8d5b2;z-index:999;font:22px Georgia,serif;pointer-events:none';
    panel.innerHTML = '<span>AuthorChe</span><progress max="1" value="0" aria-label="Завантаження гри" style="width:180px;accent-color:#c8a96e"></progress>';
    d.body.appendChild(panel);
  }
  function progress(value) {
    mount();
    if (!panel) return;
    panel.querySelector('progress').value = Number(value) || 0;
    if (value >= 1 || value === 'complete') { panel.remove(); panel = null; }
  }
  w.UnityProgress = function (_, value) { progress(value); };
  w.nitromePreloaderInit = mount;
  w.nitromePreloaderSetProgress = progress;
  w.nitromePreloaderSetComplete = function () { progress(1); };
})(window, document);
