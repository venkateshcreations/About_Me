/* Shared tab navigation + per-tab BGM for About_Me profile intros.
   Single source of truth: edit TABS here and every reel page picks it up.
   - index.html keeps its own cinematic BGM engine (bgm.mp3, scene volumes),
     so this script only builds the nav there and skips creating audio.
   - Every other page gets a looping <audio> with its assigned track.
   - Each tab has an accent color, exposed as --pt-accent for the active pill. */
(function () {
  "use strict";

  var TABS = [
    { file: "index.html",                            label: "About Me",      bgm: "bgm.mp3",  accent: "#ffb37a" },
    { file: "gallery.html",                          label: "All Intros",    bgm: null,        accent: "#f4f1ea" },
    { file: "mind-behind-the-experience.html",       label: "Mind Behind",   bgm: "bgm2.mp3",  accent: "#4c7dff" },
    { file: "motion-showreel-15s.html",              label: "Motion 15s",    bgm: "bgm3.mp3",  accent: "#ff3d9a" },
    { file: "ai-native-ux-engineering-20s.html",     label: "AI-Native UX",  bgm: "bgm4.mp3",  accent: "#7cffd4" },
    { file: "creative-ux-director.html",             label: "Creative Dir.", bgm: "bgm5.mp3",  accent: "#9a7bff" },
    { file: "ux-architecture-showreel-30s.html",     label: "UX Arch.",      bgm: "bgm6.mp3",  accent: "#ff5c8a" },
    { file: "focused-ux-domain-areas-20s.html",      label: "Domain Areas",  bgm: "bgm7.mp3",  accent: "#3de8ff" },
    { file: "from-screens-to-systems-20s.html",      label: "Screens-Systems", bgm: "bgm8.mp3", accent: "#ffc15a" },
    { file: "typographic-reel-20s.html",             label: "Typo Reel",     bgm: "bgm9.mp3",  accent: "#4dffb8" },
    { file: "prototyping-workflow.html",             label: "Prototyping",   bgm: "bgm10.mp3", accent: "#ff6a1a" },
    { file: "design-to-dev-handoff-30s.html",        label: "Handoff",       bgm: "bgm11.mp3", accent: "#a78bfa" },
    { file: "remote-studio-20s.html",                label: "Remote Studio", bgm: "bgm12.mp3", accent: "#7c6cff" }
  ];

  function currentFile() {
    try {
      var p = decodeURIComponent(window.location.pathname.split("/").pop() || "");
      return p || "index.html";
    } catch (e) { return "index.html"; }
  }

  function currentTab() {
    var cur = currentFile();
    for (var i = 0; i < TABS.length; i++) if (TABS[i].file === cur) return TABS[i];
    return TABS[0];
  }

  function soundOn() {
    try { return localStorage.getItem("aboutme-sound") !== "off"; }
    catch (e) { return true; }
  }
  function setSound(on) {
    try { localStorage.setItem("aboutme-sound", on ? "on" : "off"); } catch (e) {}
  }

  function buildNav() {
    if (document.getElementById("profile-tabs")) return;
    var cur = currentFile();
    var active = currentTab();
    // Per-tab accent drives the active pill (see tabs.css).
    try { document.documentElement.style.setProperty("--pt-accent", active.accent); } catch (e) {}

    var nav = document.createElement("nav");
    nav.id = "profile-tabs";
    nav.setAttribute("aria-label", "Profile intros");

    var brand = document.createElement("span");
    brand.className = "pt-brand";
    brand.textContent = "Venkatesh · Intros";
    nav.appendChild(brand);

    TABS.forEach(function (t) {
      var a = document.createElement("a");
      a.className = "pt-tab" + (cur === t.file ? " active" : "");
      a.textContent = t.label;
      a.href = encodeURI(t.file);
      a.title = t.label + " — " + t.bgm;
      if (cur === t.file) a.setAttribute("aria-current", "page");
      nav.appendChild(a);
    });

    var btn = document.createElement("button");
    btn.className = "pt-sound";
    btn.type = "button";
    btn.id = "pt-sound-btn";
    btn.textContent = soundOn() ? "Sound On" : "Sound Off";
    nav.appendChild(btn);

    if (document.body) document.body.insertBefore(nav, document.body.firstChild);
    else document.addEventListener("DOMContentLoaded", function () {
      document.body.insertBefore(nav, document.body.firstChild);
    });

    // Keep the active tab visible inside the scrollable strip.
    setTimeout(function () {
      var act = nav.querySelector(".pt-tab.active");
      if (act && act.scrollIntoView) act.scrollIntoView({ block: "nearest", inline: "center" });
    }, 300);

    return btn;
  }

  function fadeTo(audio, target) {
    if (!audio) return;
    var from = audio.volume, t0 = performance.now();
    if (audio._f) clearInterval(audio._f);
    audio._f = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / 600);
      audio.volume = from + (target - from) * k;
      if (k >= 1) clearInterval(audio._f);
    }, 30);
  }

  function initPageBgm(soundBtn) {
    var cur = currentFile();
    var tab = currentTab();
    if (cur !== tab.file && cur !== "index.html") return; // unknown page: nav only

    // index.html owns its BGM engine (scene-reactive volumes). Don't double-play.
    if (cur === "index.html") return;
    // Gallery and unknown pages stay silent — browse in peace.
    if (!tab.bgm) return;
    // If the page already ships its own audio element, respect it.
    if (document.getElementById("bgm") || document.querySelector("audio[data-own]")) return;

    var audio = document.createElement("audio");
    audio.id = "pt-bgm";
    audio.loop = true;
    audio.preload = "auto";
    audio.src = encodeURI(tab.bgm);
    audio.volume = 0;
    audio.addEventListener("error", function () {
      if (soundBtn) soundBtn.textContent = "No Audio";
    }, { once: true });
    document.body.appendChild(audio);

    function unlock() {
      if (!soundOn()) return;
      var pr = audio.play();
      if (pr && pr.catch) pr.catch(function () {});
      fadeTo(audio, 0.8);
      syncBtn();
    }
    function syncBtn() {
      if (!soundBtn) return;
      soundBtn.textContent = !soundOn() ? "Sound Off"
        : (audio.paused ? "Sound On · Tap" : "Sound On");
    }

    soundBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var on = !soundOn();
      setSound(on);
      if (on) { unlock(); }
      else { fadeTo(audio, 0); setTimeout(function () { if (!soundOn()) audio.pause(); }, 600); }
      syncBtn();
    });

    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, unlock, { passive: true });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) audio.pause();
      else if (soundOn()) unlock();
    });

    unlock();
    setTimeout(syncBtn, 1500);
    setInterval(syncBtn, 3000);
  }

  function prefetchNeighbors() {
    // Instant tab switching: warm the HTTP cache with the adjacent tabs'
    // HTML + BGM while the browser idles. Silent failure on file:// etc.
    var run = function () {
      try {
        var cur = currentFile(), idx = -1, i;
        for (i = 0; i < TABS.length; i++) if (TABS[i].file === cur) idx = i;
        if (idx < 0) idx = 0;
        [idx + 1, idx - 1].forEach(function (j) {
          if (j < 0 || j >= TABS.length) return;
          var t = TABS[j], l;
          if (t.file === cur) return;
          l = document.createElement("link");
          l.rel = "prefetch"; l.href = encodeURI(t.file);
          document.head.appendChild(l);
          if (t.bgm) {
            l = document.createElement("link");
            l.rel = "prefetch"; l.href = encodeURI(t.bgm);
            document.head.appendChild(l);
          }
        });
      } catch (e) {}
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 4000 });
    else setTimeout(run, 2500);
  }

  function init() {
    var btn = buildNav();
    prefetchNeighbors();
    if (document.body) initPageBgm(btn);
    else document.addEventListener("DOMContentLoaded", function () { initPageBgm(btn); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
