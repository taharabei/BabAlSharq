import { useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function RetrieveCoupon() {
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setIsSearching(true);
    setSearched(false);

    try {
      const couponsQuery = query(
        collection(db, "orders"),
        where("phone", "==", phone.trim()),
        where("couponUsed", "==", false)
      );

      const snapshot = await getDocs(couponsQuery);

      const activeCoupons = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setResults(activeCoupons);
      setSearched(true);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء البحث. تأكد من اتصالك بالإنترنت.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="page">
      <span className="page-label">استرجاع الكوبون</span>

      <h2>نسيت رقم الكوبون؟</h2>

      <p>
        أدخل رقم جوالك اللي استخدمته وقت الطلب، وراح نطلعلك أي كوبونات
        لسا ما استخدمتها.
      </p>

      <div className="staff-login-box">
        <form onSubmit={handleSearch} className="staff-login-form">
          <label>
            رقم الجوال
            <input
              type="tel"
              inputMode="numeric"
              placeholder="05xxxxxxxx"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <button
            type="submit"
            className="checkout-submit"
            disabled={isSearching}
          >
            {isSearching ? "جارٍ البحث..." : "ابحث عن الكوبون"}
          </button>
        </form>

        {searched && (
          <div style={{ marginTop: "25px" }}>
            {results.length === 0 ? (
              <p>ما فيه كوبونات نشطة مرتبطة بهذا الرقم.</p>
            ) : (
              results.map((order) => (
                <div className="order-number" key={order.id}>
                  <span>طلب #{order.orderNumber}</span>
                  <strong>{order.couponCode}</strong>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default RetrieveCoupon;