self.addEventListener("sync", (event) => {
  if (event.tag === "timer-sync") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage("check-timer"));
      })
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "ping") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage("check-timer"));
      })
    );
  }
});
