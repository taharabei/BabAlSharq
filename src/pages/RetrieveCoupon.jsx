import { useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useLanguage } from "../i18n/LanguageContext";

function RetrieveCoupon() {
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const { t } = useLanguage();

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
      alert(t("couponSearchError"));
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="page">
      <span className="page-label">{t("retrieveCouponPageLabel")}</span>

      <h2>{t("retrieveCouponTitle")}</h2>

      <p>{t("retrieveCouponDescription")}</p>

      <div className="staff-login-box">
        <form onSubmit={handleSearch} className="staff-login-form">
          <label>
            {t("phoneFieldLabel")}
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
            {isSearching ? t("searchingLabel") : t("searchButton")}
          </button>
        </form>

        {searched && (
          <div style={{ marginTop: "25px" }}>
            {results.length === 0 ? (
              <p>{t("noCouponsFound")}</p>
            ) : (
              results.map((order) => (
                <div className="order-number" key={order.id}>
                  <span>
                    {t("orderNumberPrefix")}
                    {order.orderNumber}
                  </span>
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