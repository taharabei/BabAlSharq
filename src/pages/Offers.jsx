import { useState } from "react";

function Offers() {
  const [offers, setOffers] = useState([
    {
      id: 1,
      name: "كومبو بوكس",
      description: "ميني معجنات + لتر بيبسي",
      oldPrice: 30,
      price: 22,
      active: true,
    },
    {
      id: 2,
      name: "فطيرة الزعتر والجبن",
      description: "فطيرة زعتر + فطيرة جبن + كوب شاي",
      oldPrice: 25,
      price: 19,
      active: true,
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    oldPrice: "",
    price: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addOffer = (e) => {
    e.preventDefault();

    if (!form.name || !form.description || !form.price) {
      alert("يرجى تعبئة اسم العرض والوصف والسعر.");
      return;
    }

    const newOffer = {
      id: Date.now(),
      name: form.name,
      description: form.description,
      oldPrice: Number(form.oldPrice) || 0,
      price: Number(form.price),
      active: true,
    };

    setOffers([...offers, newOffer]);

    setForm({
      name: "",
      description: "",
      oldPrice: "",
      price: "",
    });

    setShowForm(false);
  };

  const deleteOffer = (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العرض؟")) {
      setOffers(offers.filter((offer) => offer.id !== id));
    }
  };

  const toggleOffer = (id) => {
    setOffers(
      offers.map((offer) =>
        offer.id === id
          ? { ...offer, active: !offer.active }
          : offer
      )
    );
  };

  return (
    <main className="offers-page">

      <div className="offers-header">
        <div>
          <span className="page-label">إدارة العروض</span>
          <h2>العروض</h2>
          <p>أضف وعدّل وتابع عروض باب الشرق بسهولة.</p>
        </div>

        <button
          className="add-offer-button"
          onClick={() => setShowForm(!showForm)}
        >
          + إضافة عرض
        </button>
      </div>

      {showForm && (
        <form className="offer-form" onSubmit={addOffer}>
          <h3>إضافة عرض جديد</h3>

          <div className="form-grid">

            <div className="form-group">
              <label>اسم العرض</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="مثال: كومبو بوكس"
              />
            </div>

            <div className="form-group">
              <label>وصف العرض</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="اكتب تفاصيل العرض"
              />
            </div>

            <div className="form-group">
              <label>السعر قبل الخصم</label>
              <input
                type="number"
                name="oldPrice"
                value={form.oldPrice}
                onChange={handleChange}
                placeholder="30"
              />
            </div>

            <div className="form-group">
              <label>السعر بعد الخصم</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="22"
              />
            </div>

          </div>

          <div className="form-actions">
            <button type="submit" className="save-button">
              حفظ العرض
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={() => setShowForm(false)}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <section className="offers-stats">

        <div className="stat-card">
          <span>إجمالي العروض</span>
          <strong>{offers.length}</strong>
        </div>

        <div className="stat-card">
          <span>العروض الفعالة</span>
          <strong>
            {offers.filter((offer) => offer.active).length}
          </strong>
        </div>

        <div className="stat-card">
          <span>العروض المتوقفة</span>
          <strong>
            {offers.filter((offer) => !offer.active).length}
          </strong>
        </div>

      </section>

      <section className="offers-list">

        {offers.length === 0 ? (
          <div className="empty-offers">
            <h3>لا توجد عروض حاليًا</h3>
            <p>اضغط على "إضافة عرض" لإنشاء أول عرض.</p>
          </div>
        ) : (
          offers.map((offer) => (
            <article className="admin-offer-card" key={offer.id}>

              <div className="offer-card-top">
                <div className="offer-symbol">🎁</div>

                <span
                  className={
                    offer.active
                      ? "status active"
                      : "status inactive"
                  }
                >
                  {offer.active ? "فعال" : "متوقف"}
                </span>
              </div>

              <h3>{offer.name}</h3>

              <p>{offer.description}</p>

              <div className="admin-price">
                <strong>{offer.price}</strong>
                <span>ريال</span>

                {offer.oldPrice > 0 && (
                  <del>{offer.oldPrice} ريال</del>
                )}
              </div>

              <div className="offer-actions">

                <button
                  className="toggle-button"
                  onClick={() => toggleOffer(offer.id)}
                >
                  {offer.active ? "إيقاف" : "تفعيل"}
                </button>

                <button
                  className="delete-button"
                  onClick={() => deleteOffer(offer.id)}
                >
                  حذف
                </button>

              </div>

            </article>
          ))
        )}

      </section>

    </main>
  );
}

export default Offers;