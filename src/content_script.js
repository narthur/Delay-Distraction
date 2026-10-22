const ENABLED_KEY = "enabled";
const ENTRIES_KEY = "entries";
const ENTRY_KEY = "entry";
const DELAY_KEY = "time";
// Holds the URL that just finished its countdown, so that one reload goes through.
const BYPASS_KEY = "delaydistraction-bypass";

function main() {
  // The countdown's reload needs sessionStorage to let that one load through.
  // Where a site's storage is blocked the reload would loop forever, so don't delay it.
  try {
    const bypassUrl = sessionStorage.getItem(BYPASS_KEY);
    if (bypassUrl !== null) {
      sessionStorage.removeItem(BYPASS_KEY); // one use; a stale flag is dropped too
      if (bypassUrl === window.location.href) {
        return;
      }
    }
  } catch {
    return;
  }

  // Hide right away: storage is async, and waiting for it let pages half-render.
  // Trade-off: every page is blank until storage answers (a few ms).
  const root = document.documentElement;
  root.style.setProperty('visibility', 'hidden', 'important');
  const show = () => root.style.removeProperty('visibility');
  getWaitTime(window.location.href).then(waitTime => {
    if (waitTime) {
      showCountdown(waitTime, show);
    } else {
      show();
    }
  }).catch(show); // any error must still un-hide the page
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
      const delay = Number(entry[DELAY_KEY]);
      return Number.isFinite(delay) && delay > 0 ? delay : 0;
    }
  }
  return 0;
}

// Stop the real page, show a countdown, then reload it once the delay is over.
function showCountdown(delayInSeconds, show) {
  // Readable isn't always writable (e.g. a full quota). Without the bypass write the
  // reload would loop forever, so check it works before replacing the page.
  try {
    sessionStorage.setItem(BYPASS_KEY, window.location.href);
    sessionStorage.removeItem(BYPASS_KEY);
  } catch {
    show();
    return;
  }
  window.stop();
  const root = document.documentElement;
  root.replaceChildren(); // drop whatever was parsed before stop()
  show();
  root.style.colorScheme = 'light dark';
  const body = document.createElement('body');
  body.style.cssText = 'margin:0;height:100vh;display:flex;flex-direction:column;gap:1em;' +
    'align-items:center;justify-content:center;font:24px system-ui,sans-serif';
  const message = document.createElement('p');
  const nevermind = document.createElement('button');
  nevermind.textContent = 'Nevermind';
  nevermind.style.font = 'inherit';
  nevermind.addEventListener('click', () => browser.runtime.sendMessage('close-tab'));
  body.append(message, nevermind);
  root.append(body);

  const end = Date.now() + delayInSeconds * 1000;
  const tick = () => {
    const left = Math.ceil((end - Date.now()) / 1000);
    if (left <= 0) {
      try {
        sessionStorage.setItem(BYPASS_KEY, window.location.href);
      } catch {
        // Storage filled up during the countdown; reloading would just start it again.
        message.textContent = `${window.location.hostname} can't load: its storage is full.`;
        return;
      }
      window.location.reload();
      return;
    }
    message.textContent = `${window.location.hostname} loads in ${left}…`;
    setTimeout(tick, 250);
  };
  tick();
}

main();