import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { branchNames } from "../staffAccounts";
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

  const isAdmin = staffUser?.role === "admin";

  const filterOptions = [
    "الكل",
    "جديد",
    "قيد التحضير",
    "جاهز",
    "تم التسليم",
  ];

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

  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current =
          new (
            window.AudioContext ||
            window.webkitAudioContext
          )();
      }

      const audioCtx = audioContextRef.current;

      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (error) {
      console.error("خطأ في تشغيل الصوت:", error);
    }
  };

  function enableSound() {
    if (!audioContextRef.current) {
      audioContextRef.current =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    playBeep();
    setSoundEnabled(true);
  }

  async function changeStatus(orderId, newStatus) {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      });
    } catch (error) {
      console.error("خطأ في تحديث حالة الطلب:", error);
      alert("تعذر تحديث حالة الطلب. تأكد من اتصالك بالإنترنت.");
    }
  }

  async function deleteOrder(orderId) {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا الطلب؟"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (error) {
      console.error("خطأ في حذف الطلب:", error);
      alert("تعذر حذف الطلب. تأكد من اتصالك بالإنترنت.");
    }
  }

  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const liveOrders = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setOrders(liveOrders);
      },
      (error) => {
        console.error("خطأ في جلب الطلبات:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentOrderIds = branchScopedOrders.map((order) => order.id);

    if (knownOrderIds.current === null) {
      knownOrderIds.current = currentOrderIds;
      return;
    }

    const hasNewOrder = currentOrderIds.some(
      (id) => !knownOrderIds.current.includes(id)
    );

    if (hasNewOrder && soundEnabled) {
      playBeep();
    }

    knownOrderIds.current = currentOrderIds;
  }, [branchScopedOrders, soundEnabled]);

  return (
    <main className="page">
      <span className="page-label">إدارة الطلبات</span>

      <h2>
        شاشة الكاشير —{" "}
        {isAdmin ? "كل الفروع" : staffUser?.branch}
      </h2>

      <div
        className={
          branchScopedOrders.filter((order) => order.status === "جديد")
            .length > 0
            ? "cashier-summary has-new-orders"
            : "cashier-summary"
        }
      >
        الطلبات الجديدة:{" "}
        <strong>
          {
            branchScopedOrders.filter(
              (order) => order.status === "جديد"
            ).length
          }
        </strong>
      </div>

      {!soundEnabled ? (
        <button className="refresh-orders" onClick={enableSound}>
          🔊 تفعيل صوت التنبيه
        </button>
      ) : (
        <span
          style={{
            color: "green",
            marginRight: "10px",
          }}
        >
          ✓ الصوت مفعل
        </span>
      )}

      <p>إدارة الطلبات ومتابعة حالتها من شاشة الكاشير.</p>

      <div className="order-filters">
        {filterOptions.map((option) => (
          <button
            key={option}
            className={filter === option ? "active" : ""}
            onClick={() => setFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="order-filters">
          <button
            className={branchFilter === "الكل" ? "active" : ""}
            onClick={() => setBranchFilter("الكل")}
          >
            كل الفروع
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
        <div className="empty-cart">لا توجد طلبات حتى الآن.</div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order, index) => (
            <article className="order-card" key={order.id}>
              <div className="order-sequence">
                طلب رقم {index + 1}
              </div>

              <div className="order-card-header">
                <div>
                  <strong>#{order.orderNumber}</strong>

                  <span className="order-time">{order.date}</span>
                </div>

                <span className={`order-status ${order.status}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-card-info">
                <p>
                  <strong>الفرع:</strong> {order.branch || "غير محدد"}
                </p>

                <p>
                  <strong>العميل:</strong> {order.name}
                </p>

                <p>
                  <strong>الجوال:</strong> {order.phone}
                </p>

                <p>
                  <strong>طريقة الاستلام:</strong>{" "}
                  {order.deliveryType || "استلام من المطعم"}
                </p>

                {order.address && (
                  <p>
                    <strong>عنوان التوصيل:</strong> {order.address}
                  </p>
                )}

                <p>
                  <strong>التاريخ:</strong> {order.date}
                </p>

                {order.notes && (
                  <p>
                    <strong>الملاحظات:</strong> {order.notes}
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
                      {item.price * item.quantity} ريال
                    </strong>
                  </div>
                ))}
              </div>

              <div className="order-card-total">
                <span>الإجمالي</span>

                <strong>{order.total} ريال</strong>
              </div>

              <div className="order-status-buttons">
                {order.status === "جديد" && (
                  <button
                    className="next-status-button"
                    onClick={() =>
                      changeStatus(order.id, "قيد التحضير")
                    }
                  >
                    ▶ بدء التحضير
                  </button>
                )}

                {order.status === "قيد التحضير" && (
                  <button
                    className="next-status-button"
                    onClick={() => changeStatus(order.id, "جاهز")}
                  >
                    ▶ الطلب جاهز
                  </button>
                )}

                {order.status === "جاهز" && (
                  <button
                    className="next-status-button"
                    onClick={() =>
                      changeStatus(order.id, "تم التسليم")
                    }
                  >
                    ▶ تم التسليم
                  </button>
                )}

                <button
                  className="delete-order-button"
                  onClick={() => deleteOrder(order.id)}
                >
                  حذف الطلب
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