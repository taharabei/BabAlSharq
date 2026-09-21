import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useLanguage } from "../i18n/LanguageContext";

function Offers({ cart, setCart, staffUser }) {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [couponInput, setCouponInput] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "offers"),
      (snapshot) => {
        const liveOffers = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setOffers(liveOffers);
        setIsLoading(false);
      },
      (error) => {
        console.error("خطأ في جلب العروض:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  function addOfferToCart(offer) {
    const existingItem = cart.find(
      (item) => item.id === `offer-${offer.id}`
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === `offer-${offer.id}`
            ? {
              ...item,
              quantity: item.quantity + 1,
            }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...offer,
          id: `offer-${offer.id}`,
          name: offer.title,
          category: "العروض",
          quantity: 1,
        },
      ]);
    }
  }

  async function verifyCoupon(e) {
    e.preventDefault();

    const code = couponInput.trim();

    if (!code) {
      return;
    }

    setIsChecking(true);
    setCouponResult(null);

    try {
      const couponQuery = query(
        collection(db, "orders"),
        where("couponCode", "==", code)
      );

      const snapshot = await getDocs(couponQuery);

      if (snapshot.empty) {
        setCouponResult({
          status: "invalid",
          message: t("couponInvalid"),
        });
      } else {
        const orderDoc = snapshot.docs[0];
        const order = orderDoc.data();

        if (order.couponUsed) {
          setCouponResult({
            status: "used",
            message: `${t("couponUsedPrefix")} #${order.orderNumber})`,
          });
        } else {
          await updateDoc(doc(db, "orders", orderDoc.id), {
            couponUsed: true,
          });

          setCouponResult({
            status: "valid",
            message: `${t("couponValidPrefix")} #${order.orderNumber} (${order.name})`,
          });
        }
      }
    } catch (error) {
      console.error(error);
      setCouponResult({
        status: "invalid",
        message: t("couponCheckError"),
      });
    } finally {
      setCouponInput("");
      setIsChecking(false);
    }
  }

  return (
    <main className="page">
      {staffUser && (
        <div className="staff-login-box" style={{ marginBottom: "30px" }}>
          <h3>{t("couponCheckTitle")}</h3>

          <p>{t("couponCheckDescription")}</p>

          <form
            onSubmit={verifyCoupon}
            className="staff-login-form"
          >
            <label>
              {t("couponCodeLabel")}
              <input
                type="text"
                autoFocus
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
              />
            </label>

            <button
              type="submit"
              className="checkout-submit"
              disabled={isChecking}
            >
              {isChecking ? t("couponChecking") : t("couponCheckButton")}
            </button>
          </form>

          {couponResult && (
            <p
              style={{
                marginTop: "15px",
                fontWeight: "700",
                color:
                  couponResult.status === "valid"
                    ? "green"
                    : couponResult.status === "used"
                    ? "#b8860b"
                    : "#a33",
              }}
            >
              {couponResult.message}
            </p>
          )}
        </div>
      )}

      {!staffUser && (
        <div className="offers-cart-link">
          <Link to="/menu">
            🛒 {t("cartTitle")} (
            {cart.reduce(
              (total, item) => total + item.quantity,
              0
            )}
            )
          </Link>
        </div>
      )}

      <span className="page-label">{t("offersPageLabel")}</span>

      <h2>{t("offersTitle")}</h2>

      <p>{t("offersDescription")}</p>

      {isLoading ? (
        <p className="empty-cart">{t("loadingOffers")}</p>
      ) : (
        <section className="offers-grid">
          {offers.map((offer) => (
            <article className="offer-card" key={offer.id}>
              <div className="offer-image">
                <img src={offer.image} alt={offer.title} />
              </div>

              <div className="offer-content">
                <span>{t("specialOfferLabel")}</span>

                <h3>{offer.title}</h3>

                <p>{offer.description}</p>

                <div className="offer-footer">
                  <strong>
                    {offer.price} {t("currency")}
                  </strong>

                  {!staffUser && (
                    <button
                      onClick={() => addOfferToCart(offer)}
                    >
                      {t("orderNowButton")}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Offers;