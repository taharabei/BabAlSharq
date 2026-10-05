import { app, db } from "./firebase";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";

// ⚠️ ضع مفتاح VAPID هنا (من Firebase Console → Project Settings → Cloud Messaging → Web Push certificates)
const VAPID_KEY =
  "BHFnJXXzOTYMppiAXvaLzi0i_SflYyA7-YqS9tkX501Jc2L1ov7ltWaSQHDDaP_10_tljsH0OCLSKge7O0_sp8o";

export async function subscribeToPushNotifications(customerUid) {
  try {
    const supported = await isSupported();

    if (!supported || !("Notification" in window)) {
      return { success: false, reason: "unsupported" };
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return { success: false, reason: "denied" };
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { success: false, reason: "no-token" };
    }

    await setDoc(doc(db, "pushTokens", token), {
      token,
      customerUid: customerUid || null,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("خطأ بتفعيل الإشعارات:", error);
    return { success: false, reason: "error" };
  }
}