self.addEventListener("sync", (event) => {
  if (event.tag === "timer-sync") {
    event.waitUntil(handleSync());
  }
});

async function handleSync() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ action: "check-timer" });
  });
}
