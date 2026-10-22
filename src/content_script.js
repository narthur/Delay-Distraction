const ENABLED_KEY = "enabled";
const ENTRIES_KEY = "entries";
const ENTRY_KEY = "entry";
const DELAY_KEY = "time";
// Set just before the post-countdown reload so that one load goes through.
const BYPASS_KEY = "delaydistraction-bypass";

function main() {
  try {
    if (sessionStorage.getItem(BYPASS_KEY)) {
      sessionStorage.removeItem(BYPASS_KEY);
      return;
    }
  } catch {} // sessionStorage can be unavailable (e.g. data: URLs)

  // Hide right away: storage is async, and waiting for it let pages half-render.
  // ponytail: every page is blank until storage answers (a few ms).
  let root = document.documentElement;
  root.style.setProperty('visibility', 'hidden', 'important');
  let show = () => root.style.removeProperty('visibility');
  getWaitTime(window.location.href).then(waitTime => {
    if (waitTime) {
      showCountdown(waitTime);
    } else {
      show();
    }
  }, show);
}

// This should be synced with the method in common.js
async function getExtensionData(dataKey) {
  let retrieved = await browser.storage.local.get(dataKey);
  return retrieved[dataKey];
}

async function getWaitTime(url) {
  // Get from local storage
  let delayTimes = await getExtensionData(ENTRIES_KEY);
  let isEnabled = await getExtensionData(ENABLED_KEY);
  if (delayTimes && isEnabled !== false) { // unset = enabled (fresh install)
    let entry = delayTimes.find(item => url.toLowerCase().includes(item[ENTRY_KEY].toLowerCase()));
    if (entry) {
      return entry[DELAY_KEY];
    }
  }
  return 0;
}

// Stop the real page, show a countdown, then reload it once the delay is over.
function showCountdown(delayInSeconds) {
  window.stop();
  let root = document.documentElement;
  root.replaceChildren(); // drop whatever was parsed before stop()
  root.style.removeProperty('visibility');
  root.style.colorScheme = 'light dark';
  let body = document.createElement('body');
  body.style.cssText = 'margin:0;height:100vh;display:flex;flex-direction:column;gap:1em;' +
    'align-items:center;justify-content:center;font:24px system-ui,sans-serif';
  let message = document.createElement('p');
  let nevermind = document.createElement('button');
  nevermind.textContent = 'Nevermind';
  nevermind.style.font = 'inherit';
  nevermind.addEventListener('click', () => browser.runtime.sendMessage('close-tab'));
  body.append(message, nevermind);
  root.append(body);

  let end = Date.now() + delayInSeconds * 1000;
  let tick = () => {
    let left = Math.ceil((end - Date.now()) / 1000);
    if (left <= 0) {
      try { sessionStorage.setItem(BYPASS_KEY, '1'); } catch {}
      window.location.reload();
      return;
    }
    message.textContent = `${window.location.hostname} loads in ${left}…`;
    setTimeout(tick, 250);
  };
  tick();
}

main();