// Service worker nhận Web Push từ backend và hiển thị thông báo của trình duyệt.
// Payload: { title, body, link } (link là đường dẫn tương đối trên cửa hàng).

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Thông báo mới";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/favicon.ico",
      data: { link: payload.link || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Chỉ mở đường dẫn trong cùng trang web
  const target = new URL(event.notification.data?.link || "/", self.location.origin);
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const opened = windows.find(
          (client) => new URL(client.url).origin === target.origin,
        );
        if (opened) {
          // navigate() chỉ dùng được với trang do service worker này điều khiển
          return opened
            .focus()
            .then(() => opened.navigate(target.href))
            .catch(() => self.clients.openWindow(target.href));
        }
        return self.clients.openWindow(target.href);
      }),
  );
});

// Điều khiển ngay các trang đang mở, không cần tải lại
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
