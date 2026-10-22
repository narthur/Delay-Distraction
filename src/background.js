// Content scripts can't close their own tab, so the countdown page asks us to.
browser.runtime.onMessage.addListener((message, sender) => {
  if (message === "close-tab" && sender.tab) {
    browser.tabs.remove(sender.tab.id);
  }
});
