import { useState } from "react";
import { db } from "../firebase";
import { branchNames } from "../staffAccounts";
import { ORDER_STATUSES } from "../constants";
import { useLanguage } from "../i18n/LanguageContext";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

function Checkout({ cart, setCart }) {
  const [branch, setBranch] = useState(branchNames[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [deliveryType, setDeliveryType] = useState("استلام من المطعم");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [orderNumber, setOrderNumber] = useState(null);
  const [couponCode, setCouponCode] = useState(null);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useLanguage();

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  function isValidPhone(value) {
    return /^05[0-9]{8}$/.test(value);
  }

  async function generateUniqueCoupon() {
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = String(Math.floor(100000 + Math.random() * 900000));

      const couponQuery = query(
        collection(db, "orders"),
        where("couponCode", "==", code)
      );

      const existing = await getDocs(couponQuery);

      if (existing.empty) {
        isUnique = true;
      }
    }

    return code;
  }

  function handlePhoneChange(value) {
    setPhone(value);

    if (value.length === 0) {
      setPhoneError("");
    } else if (!isValidPhone(value)) {
      setPhoneError(t("phoneInvalid"));
    } else {
      setPhoneError("");
    }
  }

  async function confirmOrder() {
    if (!name.trim()) {
      alert(t("nameRequired"));
      return;
    }

    if (!isValidPhone(phone)) {
      setPhoneError(t("phoneInvalid"));
      return;
    }

    if (deliveryType === "توصيل" && !address.trim()) {
      alert(t("addressRequired"));
      return;
    }

    if (cart.length === 0) {
      alert(t("cartEmptyAlert"));
      return;
    }

    setIsSubmitting(true);

    try {
      const number = Math.floor(1000 + Math.random() * 9000);
      const newOrderNumber = `BS-${number}`;

      const hasOffer = cart.some(
        (item) => item.category === "العروض"
      );

      const newCoupon = hasOffer
        ? await generateUniqueCoupon()
        : null;

      const newOrder = {
        orderNumber: newOrderNumber,
        couponCode: newCoupon,
        couponUsed: newCoupon ? false : null,
        branch: branch,
        name: name,
        phone: phone,
        deliveryType: deliveryType,
        address: deliveryType === "توصيل" ? address : "",
        notes: notes,
        items: cart,
        total: cartTotal,
        date: new Date().toLocaleString("ar-SA"),
        createdAt: Date.now(),
        status: ORDER_STATUSES.NEW,
      };

      // حفظ الطلب في قاعدة البيانات
      await addDoc(collection(db, "orders"), newOrder);

      // التحقق هل العميل مسجل من قبل
      const customersQuery = query(
        collection(db, "customers"),
        where("phone", "==", phone)
      );

      const existingCustomers = await getDocs(customersQuery);

      if (existingCustomers.empty) {
        await addDoc(collection(db, "customers"), {
          name: name,
          phone: phone,
          date: new Date().toLocaleString("ar-SA"),
        });
      }

      setConfirmedTotal(cartTotal);
      setCouponCode(newCoupon);
      setOrderNumber(newOrderNumber);
      setCart([]);
    } catch (error) {
      console.error("خطأ في إرسال الطلب:", error);
      alert(t("orderSubmitError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderNumber) {
    return (
      <main className="page">
        <div className="order-success">
          <span className="page-label">{t("checkoutSuccessLabel")}</span>

          <h2>{t("checkoutSuccessTitle")}</h2>

          <p>
            {t("checkoutThanksPrefix")} {name}
            {t("checkoutThanksSuffix")} {branch}.
          </p>

          <div className="order-number">
            <span>{t("orderNumberLabel")}</span>
            <strong>#{orderNumber}</strong>
          </div>

          {couponCode && (
            <div className="order-number">
              <span>{t("couponCodeLabel2")}</span>
              <strong>{couponCode}</strong>
            </div>
          )}

          <div className="order-summary">
            <span>{t("orderTotalLabel")}</span>
            <strong>
              {confirmedTotal} {t("currency")}
            </strong>
          </div>

          {couponCode ? (
            <p>{t("keepCouponNote")}</p>
          ) : (
            <p>{t("keepOrderNumberNote")}</p>
          )}

          <a href="/menu" className="back-to-menu">
            {t("backToMenuButton")}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <span className="page-label">{t("checkoutPageLabel")}</span>

      <h2>{t("checkoutTitle")}</h2>

      <p>{t("checkoutDescription")}</p>

      <div className="checkout-layout">
        <div className="checkout-cart">
          <h3>{t("orderReviewTitle")}</h3>

          {cart.length === 0 ? (
            <p>{t("emptyCartCheckout")}</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="checkout-cart-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>

                    <span>
                      {item.price} {t("currency")} × {item.quantity}
                    </span>
                  </div>

                  <strong>
                    {item.price * item.quantity} {t("currency")}
                  </strong>
                </div>
              ))}

              <div className="checkout-cart-total">
                <span>{t("totalLabel")}</span>

                <strong>
                  {cartTotal} {t("currency")}
                </strong>
              </div>
            </>
          )}
        </div>

        <div className="checkout-form">
          <h3>{t("yourDataTitle")}</h3>

          <label>
            {t("branchFieldLabel")}
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              {branchNames.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("nameFieldLabel")}
            <input
              type="text"
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            {t("phoneFieldLabel")}
            <input
              type="tel"
              inputMode="numeric"
              placeholder="05xxxxxxxx"
              maxLength={10}
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={phoneError ? "input-error" : ""}
            />
            {phoneError && (
              <span className="field-error">{phoneError}</span>
            )}
          </label>

          <label>
            {t("deliveryTypeFieldLabel")}
            <select
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
            >
              <option value="استلام من المطعم">{t("pickupOption")}</option>
              <option value="توصيل">{t("deliveryOption")}</option>
            </select>
          </label>

          {deliveryType === "توصيل" && (
            <label>
              {t("deliveryAddressFieldLabel")}
              <input
                type="text"
                placeholder={t("addressPlaceholder")}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
          )}

          <label>
            {t("orderNotesLabel")}
            <textarea
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <button
            className="checkout-submit"
            onClick={confirmOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("submittingOrder") : t("confirmOrderButton")}
          </button>
        </div>
      </div>
    </main>
  );
}

export default Checkout;