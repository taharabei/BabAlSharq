import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useLanguage } from "../i18n/LanguageContext";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

  const statusLabels = {
    "جديد": t("statusNew"),
    "قيد التحضير": t("statusPreparing"),
    "جاهز": t("statusReady"),
    "تم التسليم": t("statusDelivered"),
  };

  useEffect(() => {
    const unsubscribeCustomers = onSnapshot(
      collection(db, "customers"),
      (snapshot) => {
        const liveCustomers = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setCustomers(liveCustomers);
      },
      (error) => {
        console.error("خطأ في جلب العملاء:", error);
      }
    );

    const unsubscribeOrders = onSnapshot(
      collection(db, "orders"),
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

    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
    };
  }, []);

  async function deleteCustomer(customerId) {
    const confirmed = window.confirm(t("deleteCustomerConfirm"));

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "customers", customerId));
    } catch (error) {
      console.error("خطأ في حذف العميل:", error);
      alert(t("deleteCustomerFailed"));
    }
  }

  function getCustomerOrders(phone) {
    return orders.filter((order) => order.phone === phone);
  }

  const filteredCustomers = customers.filter((customer) => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return true;
    }

    return (
      customer.name?.toLowerCase().includes(searchText) ||
      customer.phone?.includes(searchText) ||
      customer.city?.toLowerCase().includes(searchText)
    );
  });

  return (
    <main className="page">
      <span className="page-label">{t("customersPageLabel")}</span>

      <h2>{t("customersTitle")}</h2>

      <p>{t("customersDescription")}</p>

      <div className="customers-summary">
        <div className="customer-stat">
          <span>{t("totalCustomersLabel")}</span>
          <strong>{customers.length}</strong>
        </div>

        <div className="customer-stat">
          <span>{t("searchResultsLabel")}</span>
          <strong>{filteredCustomers.length}</strong>
        </div>
      </div>

      {customers.length > 0 && (
        <div className="customers-search">
          <input
            type="text"
            placeholder={t("searchCustomersPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button onClick={() => setSearch("")}>
              {t("clearSearchButton")}
            </button>
          )}
        </div>
      )}

      {customers.length === 0 ? (
        <div className="empty-cart">{t("noCustomersYet")}</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="empty-cart">{t("noSearchResults")}</div>
      ) : (
        <div className="customers-list">
          {filteredCustomers.map((customer, index) => {
            const customerOrders = getCustomerOrders(
              customer.phone
            );

            const lastOrder =
              customerOrders.length > 0
                ? customerOrders[customerOrders.length - 1]
                : null;

            return (
              <article className="customer-card" key={customer.id}>
                <div className="customer-number">
                  #{index + 1}
                </div>

                <div className="customer-info">
                  <h3>{customer.name}</h3>

                  <p>📱 {customer.phone}</p>

                  <p>
                    📍 {customer.city || t("cityNotRegistered")}
                  </p>

                  <span>
                    {t("registrationDateLabel")}{" "}
                    {customer.date || t("notSpecifiedFem")}
                  </span>

                  <div className="customer-orders-info">
                    <span className="customer-orders-count">
                      {t("orderCountLabel")} {customerOrders.length}
                    </span>

                    {lastOrder && (
                      <span className="customer-last-order">
                        {t("lastOrderLabel")} {lastOrder.date} —{" "}
                        {lastOrder.total} {t("currency")} (
                        {statusLabels[lastOrder.status] || lastOrder.status})
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="customer-delete-button"
                  onClick={() => deleteCustomer(customer.id)}
                >
                  {t("deleteButton")}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Customers;