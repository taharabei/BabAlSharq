importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAzrheo6aFCUaq7LB4BBC1vtjg9lfCDwPU",
  authDomain: "babel-pastries.firebaseapp.com",
  projectId: "babel-pastries",
  storageBucket: "babel-pastries.firebasestorage.app",
  messagingSenderId: "391551115236",
  appId: "1:391551115236:web:386d60728f251bddc9b1f1",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    payload.notification?.title || "بابل للمعجنات";

  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/logo.jpg",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});