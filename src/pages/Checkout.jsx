import { useState } from "react";
import { db } from "../firebase";
import { branchNames } from "../staffAccounts";
import { ORDER_STATUSES } from "../constants";
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
      setPhoneError("رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام");
    } else {
      setPhoneError("");
    }
  }

  async function confirmOrder() {
    if (!name.trim()) {
      alert("يرجى إدخال الاسم");
      return;
    }

    if (!isValidPhone(phone)) {
      setPhoneError("رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام");
      return;
    }

    if (deliveryType === "توصيل" && !address.trim()) {
      alert("يرجى إدخال عنوان التوصيل");
      return;
    }

    if (cart.length === 0) {
      alert("السلة فارغة");
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
      alert(
        "حدث خطأ أثناء إرسال الطلب. تأكد من اتصالك بالإنترنت وحاول مرة أخرى."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (orderNumber) {
    return (
      <main className="page">
        <div className="order-success">
          <span className="page-label">تم بنجاح</span>

          <h2>تم استلام طلبك 🎉</h2>

          <p>شكرًا لك {name}، تم استلام طلبك بنجاح من {branch}.</p>

          <div className="order-number">
            <span>رقم الطلب</span>
            <strong>#{orderNumber}</strong>
          </div>

          {couponCode && (
            <div className="order-number">
              <span>رمز الكوبون</span>
              <strong>{couponCode}</strong>
            </div>
          )}

          <div className="order-summary">
            <span>إجمالي الطلب</span>
            <strong>{confirmedTotal} ريال</strong>
          </div>

          {couponCode ? (
            <p>احتفظ برمز الكوبون وأرِه للكاشير عند استلام طلبك.</p>
          ) : (
            <p>احتفظ برقم الطلب لمتابعة طلبك.</p>
          )}

          <a href="/menu" className="back-to-menu">
            العودة للقائمة
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <span className="page-label">إتمام الطلب</span>

      <h2>تأكيد الطلب</h2>

      <p>أدخل بياناتك لإتمام طلبك من بابل للمعجنات.</p>

      <div className="checkout-layout">
        <div className="checkout-cart">
          <h3>مراجعة الطلب</h3>

          {cart.length === 0 ? (
            <p>لا توجد أصناف في السلة.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="checkout-cart-item" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>

                    <span>
                      {item.price} ريال × {item.quantity}
                    </span>
                  </div>

                  <strong>{item.price * item.quantity} ريال</strong>
                </div>
              ))}

              <div className="checkout-cart-total">
                <span>الإجمالي</span>

                <strong>{cartTotal} ريال</strong>
              </div>
            </>
          )}
        </div>

        <div className="checkout-form">
          <h3>بياناتك</h3>

          <label>
            الفرع
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
            الاسم
            <input
              type="text"
              placeholder="اكتب اسمك"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            رقم الجوال
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
            طريقة الاستلام
            <select
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
            >
              <option>استلام من المطعم</option>
              <option>توصيل</option>
            </select>
          </label>

          {deliveryType === "توصيل" && (
            <label>
              عنوان التوصيل
              <input
                type="text"
                placeholder="الحي، الشارع، رقم المبنى..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
          )}

          <label>
            ملاحظات الطلب
            <textarea
              placeholder="أي ملاحظات إضافية؟"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <button
            className="checkout-submit"
            onClick={confirmOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? "جارٍ إرسال الطلب..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default Checkout;