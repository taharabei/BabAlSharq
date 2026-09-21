import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { branchNames } from "../staffAccounts";
import { ORDER_STATUSES, ORDER_STATUS_LIST } from "../constants";
import { useLanguage } from "../i18n/LanguageContext";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

function Orders({ staffUser }) {
  const [orders, setOrders] = useState([]);
  const knownOrderIds = useRef(null);
  const [filter, setFilter] = useState("الكل");
  const [branchFilter, setBranchFilter] = useState("الكل");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const soundEnabledRef = useRef(false);

  const { t } = useLanguage();

  const isAdmin = staffUser?.role === "admin";

  const filterOptions = ["الكل", ...ORDER_STATUS_LIST];

  const statusLabels = {
    "الكل": t("categoryAll"),
    "جديد": t("statusNew"),
    "قيد التحضير": t("statusPreparing"),
    "جاهز": t("statusReady"),
    "تم التسليم": t("statusDelivered"),
  };

  const branchScopedOrders = isAdmin
    ? orders
    : orders.filter((order) => order.branch === staffUser?.branch);

  const branchFilteredOrders = isAdmin
    ? branchScopedOrders.filter(
        (order) =>
          branchFilter === "الكل" || order.branch === branchFilter
      )
    : branchScopedOrders;

  const filteredOrders = branchFilteredOrders.filter(
    (order) => filter === "الكل" || order.status === filter
  );

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current =
        new (window.AudioContext || window.webkitAudioContext)();
      console.log(
        "[صوت] تم إنشاء AudioContext جديد، الحالة الحالية:",
        audioContextRef.current.state
      );
    }
    return audioContextRef.current;
  };

  const playBeep = (source) => {
    try {
      const audioCtx = getAudioContext();

      console.log(
        `[صوت] محاولة تشغيل صوت (السبب: ${source}) — حالة السياق: ${audioCtx.state}`
      );

      if (audioCtx.state === "suspended") {
        audioCtx.resume().then(() => {
          console.log("[صوت] تم استئناف السياق بنجاح، الحالة الآن:", audioCtx.state);
        }).catch((err) => {
          console.error("[صوت] فشل استئناف السياق:", err);
        });
      }

      // 3 نغمات متتالية عشان يصير التنبيه أوضح وأطول
      const beepTimes = [0, 0.5, 1.0];

      beepTimes.forEach((delay) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = "sine";

        const startTime = audioCtx.currentTime + delay;

        oscillator.frequency.setValueAtTime(850, startTime);
        gainNode.gain.setValueAtTime(0.35, startTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.35);
      });

      console.log("[صوت] تم إصدار أمر تشغيل الصوت (3 نغمات).");
    } catch (error) {
      console.error("[صوت] خطأ في تشغيل الصوت:", error);
    }
  };

  function activateSound(source) {
    if (soundEnabledRef.current) return;

    console.log(`[صوت] تفعيل الصوت (السبب: ${source})`);

    const audioCtx = getAudioContext();

    if (audioCtx.state === "suspended") {
      audioCtx.resume().then(() => {
        console.log("[صوت] تم تفعيل السياق فعلياً، الحالة:", audioCtx.state);
      }).catch((err) => {
        console.error("[صوت] فشل تفعيل السياق:", err);
      });
    }

    soundEnabledRef.current = true;
    setSoundEnabled(true);
  }

  function enableSoundManually() {
    activateSound("ضغطة الزر اليدوي");
    playBeep("اختبار يدوي بعد الضغط على الزر");
  }

  // ===== تفعيل الصوت تلقائياً عند أول تفاعل من الكاشير بالصفحة (أي ضغطة) =====
  useEffect(() => {
    if (soundEnabled) return;

    function handleFirstInteraction() {
      console.log("[صوت] تم رصد أول تفاعل بالصفحة (ضغطة/زر لوحة مفاتيح)");
      activateSound("أول تفاعل تلقائي بالصفحة");
    }

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);

    console.log("[صوت] تم تركيب مستمع أول تفاعل بالصفحة.");

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [soundEnabled]);

  async function changeStatus(orderId, newStatus) {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      });
    } catch (error) {
      console.error("خطأ في تحديث حالة الطلب:", error);
      alert(t("updateStatusFailed"));
    }
  }

  async function deleteOrder(orderId) {
    const confirmed = window.confirm(t("deleteOrderConfirm"));

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (error) {
      console.error("خطأ في حذف الطلب:", error);
      alert(t("deleteOrderFailed"));
    }
  }

  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "asc")
    );

    let isFirstLoad = true;

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const liveOrders = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        if (isFirstLoad) {
          // أول تحميل للطلبات الموجودة أصلاً: نسجلها كـ "معروفة" فوراً
          // بدون محاولة تشغيل صوت لها (مهم جداً، هذا كان سبب تعليق الصوت)
          knownOrderIds.current = liveOrders.map((order) => order.id);
          isFirstLoad = false;
          console.log(
            "[صوت] تم تحميل الطلبات الحالية عند فتح الصفحة، العدد:",
            liveOrders.length
          );
        }

        setOrders(liveOrders);
      },
      (error) => {
        console.error("خطأ في جلب الطلبات:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (knownOrderIds.current === null) {
      // لسا ما تحمّل أول دفعة طلبات، تجاهل
      return;
    }

    const currentOrderIds = branchScopedOrders.map((order) => order.id);

    const newOrderIds = currentOrderIds.filter(
      (id) => !knownOrderIds.current.includes(id)
    );

    if (newOrderIds.length > 0) {
      console.log(
        "[صوت] تم رصد طلب/طلبات جديدة فعلياً:",
        newOrderIds
      );
      playBeep("وصول طلب جديد");
    }

    knownOrderIds.current = currentOrderIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchScopedOrders]);

  return (
    <main className="page">
      <span className="page-label">{t("ordersPageLabel")}</span>

      <h2>
        {t("cashierTitlePrefix")}{" "}
        {isAdmin ? t("allBranchesLabel") : staffUser?.branch}
      </h2>

      <div
        className={
          branchScopedOrders.filter(
            (order) => order.status === ORDER_STATUSES.NEW
          ).length > 0
            ? "cashier-summary has-new-orders"
            : "cashier-summary"
        }
      >
        {t("newOrdersLabel")}{" "}
        <strong>
          {
            branchScopedOrders.filter(
              (order) => order.status === ORDER_STATUSES.NEW
            ).length
          }
        </strong>
      </div>

      {!soundEnabled ? (
        <button className="refresh-orders" onClick={enableSoundManually}>
          {t("enableSoundButton")}
        </button>
      ) : (
        <span
          style={{
            color: "green",
            marginRight: "10px",
          }}
        >
          {t("soundEnabledLabel")}
        </span>
      )}

      <p>{t("cashierDescription")}</p>

      <div className="order-filters">
        {filterOptions.map((option) => (
          <button
            key={option}
            className={filter === option ? "active" : ""}
            onClick={() => setFilter(option)}
          >
            {statusLabels[option] || option}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="order-filters">
          <button
            className={branchFilter === "الكل" ? "active" : ""}
            onClick={() => setBranchFilter("الكل")}
          >
            {t("allBranchesLabel")}
          </button>

          {branchNames.map((b) => (
            <button
              key={b}
              className={branchFilter === b ? "active" : ""}
              onClick={() => setBranchFilter(b)}
            >
              {b}
            </button>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="empty-cart">{t("noOrdersYet")}</div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order, index) => (
            <article className="order-card" key={order.id}>
              <div className="order-sequence">
                {t("orderSequencePrefix")} {index + 1}
              </div>

              <div className="order-card-header">
                <div>
                  <strong>#{order.orderNumber}</strong>

                  <span className="order-time">{order.date}</span>
                </div>

                <span className={`order-status ${order.status}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className="order-card-info">
                <p>
                  <strong>{t("branchLabel")}</strong>{" "}
                  {order.branch || t("notSpecified")}
                </p>

                <p>
                  <strong>{t("customerLabel")}</strong> {order.name}
                </p>

                <p>
                  <strong>{t("phoneLabel")}</strong> {order.phone}
                </p>

                <p>
                  <strong>{t("deliveryTypeLabel")}</strong>{" "}
                  {order.deliveryType || t("pickupDefault")}
                </p>

                {order.address && (
                  <p>
                    <strong>{t("deliveryAddressLabel")}</strong>{" "}
                    {order.address}
                  </p>
                )}

                <p>
                  <strong>{t("dateLabel")}</strong> {order.date}
                </p>

                {order.notes && (
                  <p>
                    <strong>{t("notesLabel")}</strong> {order.notes}
                  </p>
                )}
              </div>

              <div className="order-card-items">
                {order.items.map((item) => (
                  <div key={item.id}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>

                    <strong>
                      {item.price * item.quantity} {t("currency")}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="order-card-total">
                <span>{t("totalLabel")}</span>

                <strong>
                  {order.total} {t("currency")}
                </strong>
              </div>

              <div className="order-status-buttons">
                {order.status === ORDER_STATUSES.NEW && (
                  <button
                    className="next-status-button"
                    onClick={() =>
                      changeStatus(order.id, ORDER_STATUSES.PREPARING)
                    }
                  >
                    {t("startPreparingButton")}
                  </button>
                )}

                {order.status === ORDER_STATUSES.PREPARING && (
                  <button
                    className="next-status-button"
                    onClick={() =>
                      changeStatus(order.id, ORDER_STATUSES.READY)
                    }
                  >
                    {t("orderReadyButton")}
                  </button>
                )}

                {order.status === ORDER_STATUSES.READY && (
                  <button
                    className="next-status-button"
                    onClick={() =>
                      changeStatus(order.id, ORDER_STATUSES.DELIVERED)
                    }
                  >
                    {t("deliveredButton")}
                  </button>
                )}

                <button
                  className="delete-order-button"
                  onClick={() => deleteOrder(order.id)}
                >
                  {t("deleteOrderButton")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Orders;