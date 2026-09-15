import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");

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
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا العميل؟"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "customers", customerId));
    } catch (error) {
      console.error("خطأ في حذف العميل:", error);
      alert("تعذر حذف العميل. تأكد من اتصالك بالإنترنت.");
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
      <span className="page-label">إدارة العملاء</span>

      <h2>العملاء</h2>

      <p>هنا تظهر بيانات العملاء المسجلين في بابل للمعجنات.</p>

      <div className="customers-summary">
        <div className="customer-stat">
          <span>إجمالي العملاء</span>
          <strong>{customers.length}</strong>
        </div>

        <div className="customer-stat">
          <span>نتائج البحث</span>
          <strong>{filteredCustomers.length}</strong>
        </div>
      </div>

      {customers.length > 0 && (
        <div className="customers-search">
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الجوال أو المدينة"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button onClick={() => setSearch("")}>
              مسح البحث
            </button>
          )}
        </div>
      )}

      {customers.length === 0 ? (
        <div className="empty-cart">لا يوجد عملاء حتى الآن.</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="empty-cart">
          لا توجد نتائج مطابقة للبحث.
        </div>
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
                    📍 {customer.city || "المدينة غير مسجلة"}
                  </p>

                  <span>
                    تاريخ التسجيل: {customer.date || "غير محدد"}
                  </span>

                  <div className="customer-orders-info">
                    <span className="customer-orders-count">
                      🧾 عدد الطلبات: {customerOrders.length}
                    </span>

                    {lastOrder && (
                      <span className="customer-last-order">
                        آخر طلب: {lastOrder.date} —{" "}
                        {lastOrder.total} ريال (
                        {lastOrder.status})
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="customer-delete-button"
                  onClick={() => deleteCustomer(customer.id)}
                >
                  حذف
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