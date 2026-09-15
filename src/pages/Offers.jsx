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

function Offers({ cart, setCart, staffUser }) {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [couponInput, setCouponInput] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

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
          message: "❌ هذا الرمز غير صحيح أو غير موجود",
        });
      } else {
        const orderDoc = snapshot.docs[0];
        const order = orderDoc.data();

        if (order.couponUsed) {
          setCouponResult({
            status: "used",
            message: `⚠️ هذا الكوبون مستخدم مسبقًا (طلب #${order.orderNumber})`,
          });
        } else {
          await updateDoc(doc(db, "orders", orderDoc.id), {
            couponUsed: true,
          });

          setCouponResult({
            status: "valid",
            message: `✅ كوبون صالح — طلب #${order.orderNumber} (${order.name})`,
          });
        }
      }
    } catch (error) {
      console.error(error);
      setCouponResult({
        status: "invalid",
        message: "❌ حدث خطأ أثناء التحقق. تأكد من اتصالك بالإنترنت.",
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
          <h3>تحقق من الكوبون</h3>

          <p>
            اكتب الرمز يدويًا أو مرّر الباركود مباشرة (سيُكتب
            تلقائيًا).
          </p>

          <form
            onSubmit={verifyCoupon}
            className="staff-login-form"
          >
            <label>
              رمز الكوبون
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
              {isChecking ? "جارٍ التحقق..." : "تحقق"}
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
            🛒 السلة (
            {cart.reduce(
              (total, item) => total + item.quantity,
              0
            )}
            )
          </Link>
        </div>
      )}

      <span className="page-label">عروض بابل للمعجنات</span>

      <h2>العروض</h2>

      <p>
        استفد من عروض بابل للمعجنات المميزة.
      </p>

      {isLoading ? (
        <p className="empty-cart">جارٍ تحميل العروض...</p>
      ) : (
        <section className="offers-grid">
          {offers.map((offer) => (
            <article className="offer-card" key={offer.id}>
              <div className="offer-image">
                <img src={offer.image} alt={offer.title} />
              </div>

              <div className="offer-content">
                <span>عرض خاص</span>

                <h3>{offer.title}</h3>

                <p>{offer.description}</p>

                <div className="offer-footer">
                  <strong>{offer.price} ريال</strong>

                  {!staffUser && (
                    <button
                      onClick={() => addOfferToCart(offer)}
                    >
                      اطلب الآن
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