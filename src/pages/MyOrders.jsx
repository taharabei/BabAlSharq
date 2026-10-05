import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useLanguage } from "../i18n/LanguageContext";

function MyOrders({ customerUser }) {
  const [orders, setOrders] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    if (!customerUser?.phone) {
      setOrders([]);
      return;
    }

    const ordersQuery = query(
      collection(db, "orders"),
      where("phone", "==", customerUser.phone)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const list = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(list);
    });

    return () => unsubscribe();
  }, [customerUser?.phone]);

  function statusLabel(status) {
    switch (status) {
      case "جديد":
        return t("statusNew");
      case "قيد التحضير":
        return t("statusPreparing");
      case "جاهز":
        return t("statusReady");
      case "تم التسليم":
        return t("statusDelivered");
      default:
        return status;
    }
  }

  if (!customerUser) {
    return (
      <main className="page">
        <span className="page-label">{t("myOrdersPageLabel")}</span>
        <h2>{t("myOrdersTitle")}</h2>
        <p>{t("myOrdersLoginRequired")}</p>

        <Link to="/account" className="back-to-menu">
          {t("accountLoginButton")}
        </Link>
      </main>
    );
  }

  return (
    <main className="page">
      <span className="page-label">{t("myOrdersPageLabel")}</span>
      <h2>{t("myOrdersTitle")}</h2>
      <p>{t("myOrdersDescription")}</p>

      {orders.length === 0 ? (
        <p>{t("noOrdersYet")}</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-card-header">
                <strong>#{order.orderNumber}</strong>
                <span className={"order-status " + order.status}>
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="order-card-info">
                <p>
                  {t("branchLabel")} {order.branch}
                </p>
                <p>
                  {t("dateLabel")} {order.date}
                </p>
              </div>

              <div className="order-card-items">
                {(order.items || []).map((item, index) => (
                  <div key={index}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      {item.price * item.quantity} {t("currency")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-card-total">
                <span>{t("totalLabel")}</span>
                <strong>
                  {order.total} {t("currency")}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyOrders;