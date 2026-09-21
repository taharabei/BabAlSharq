import { useState, useEffect } from "react";
import { db } from "../firebase";
import * as XLSX from "xlsx";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

const emptyItemForm = {
  name: "",
  category: "المعجنات",
  description: "",
  price: "",
  image: "",
};

const emptyOfferForm = {
  title: "",
  description: "",
  price: "",
  image: "",
};

// إعدادات Cloudinary الخاصّة بك
const CLOUD_NAME = "jh8q7zzp";
const UPLOAD_PRESET = "babel_uploads";

function Admin({ staffUser }) {
  const [menuItems, setMenuItems] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);

  const [offers, setOffers] = useState([]);
  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [uploadingOfferImage, setUploadingOfferImage] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const [featuredIds, setFeaturedIds] = useState([]);
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);

  // دالة رفع الصور المباشرة إلى Cloudinary مع إظهار تفاصيل الخطأ
  async function handleCloudinaryUpload(file, setFormState, setUploadingState) {
    if (!file) return;

    setUploadingState(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setFormState((prev) => ({ ...prev, image: data.secure_url }));
      } else {
        console.error("Cloudinary Error Details:", data);
        alert(
          `خطأ من Cloudinary: ${
            data.error?.message || "تأكد من أن الـ Preset نوعه Unsigned"
          }`
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("فشل الاتصال بسيرفر رفع الصور.");
    } finally {
      setUploadingState(false);
    }
  }

  function toggleFeatured(itemId) {
    if (featuredIds.includes(itemId)) {
      setFeaturedIds(featuredIds.filter((id) => id !== itemId));
    } else {
      if (featuredIds.length >= 3) {
        alert("يمكنك اختيار 3 وجبات كحد أقصى");
        return;
      }

      setFeaturedIds([...featuredIds, itemId]);
    }
  }

  async function saveFeaturedItems() {
    setIsSavingFeatured(true);

    try {
      await setDoc(doc(db, "settings", "home"), {
        featuredItemIds: featuredIds,
      });

      alert("تم حفظ الوجبات المميزة بنجاح");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ. تأكد من اتصالك بالإنترنت.");
    } finally {
      setIsSavingFeatured(false);
    }
  }

  async function exportCustomersToExcel() {
    setIsExporting(true);

    try {
      const customersSnap = await getDocs(collection(db, "customers"));
      const ordersSnap = await getDocs(collection(db, "orders"));

      const customersList = customersSnap.docs.map((d) => d.data());
      const ordersList = ordersSnap.docs.map((d) => d.data());

      const rows = customersList.map((customer) => {
        const customerOrders = ordersList.filter(
          (order) => order.phone === customer.phone
        );

        return {
          الاسم: customer.name || "",
          "رقم الجوال": customer.phone || "",
          "تاريخ التسجيل": customer.date || "",
          "عدد الطلبات": customerOrders.length,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "العملاء");

      XLSX.writeFile(workbook, "عملاء بابل للمعجنات.xlsx");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء التصدير. تأكد من اتصالك بالإنترنت.");
    } finally {
      setIsExporting(false);
    }
  }

  useEffect(() => {
    const unsubscribeItems = onSnapshot(
      collection(db, "menuItems"),
      (snapshot) => {
        const liveItems = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setMenuItems(liveItems);
      }
    );

    const unsubscribeOffers = onSnapshot(
      collection(db, "offers"),
      (snapshot) => {
        const liveOffers = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setOffers(liveOffers);
      }
    );

    const unsubscribeSettings = onSnapshot(
      doc(db, "settings", "home"),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().featuredItemIds) {
          setFeaturedIds(docSnap.data().featuredItemIds);
        }
      }
    );

    return () => {
      unsubscribeItems();
      unsubscribeOffers();
      unsubscribeSettings();
    };
  }, []);

  // ===== أصناف القائمة =====

  function startEditItem(item) {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      image: item.image,
    });
  }

  function cancelItemForm() {
    setEditingItemId(null);
    setItemForm(emptyItemForm);
  }

  async function saveItem(e) {
    e.preventDefault();

    if (!itemForm.name.trim() || !itemForm.price) {
      alert("يرجى إدخال الاسم والسعر على الأقل");
      return;
    }

    const dataToSave = {
      name: itemForm.name.trim(),
      category: itemForm.category,
      description: itemForm.description.trim(),
      price: Number(itemForm.price),
      image: itemForm.image.trim(),
    };

    try {
      if (editingItemId) {
        await updateDoc(doc(db, "menuItems", editingItemId), dataToSave);
      } else {
        await addDoc(collection(db, "menuItems"), dataToSave);
      }

      cancelItemForm();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ. تأكد من اتصالك بالإنترنت.");
    }
  }

  async function deleteItem(itemId) {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذا الصنف؟");

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "menuItems", itemId));
    } catch (error) {
      console.error(error);
      alert("تعذر حذف الصنف. تأكد من اتصالك بالإنترنت.");
    }
  }

  // ===== العروض =====

  function startEditOffer(offer) {
    setEditingOfferId(offer.id);
    setOfferForm({
      title: offer.title,
      description: offer.description,
      price: offer.price,
      image: offer.image,
    });
  }

  function cancelOfferForm() {
    setEditingOfferId(null);
    setOfferForm(emptyOfferForm);
  }

  async function saveOffer(e) {
    e.preventDefault();

    if (!offerForm.title.trim() || !offerForm.price) {
      alert("يرجى إدخال العنوان والسعر على الأقل");
      return;
    }

    const dataToSave = {
      title: offerForm.title.trim(),
      description: offerForm.description.trim(),
      price: Number(offerForm.price),
      image: offerForm.image.trim(),
    };

    try {
      if (editingOfferId) {
        await updateDoc(doc(db, "offers", editingOfferId), dataToSave);
      } else {
        await addDoc(collection(db, "offers"), dataToSave);
      }

      cancelOfferForm();
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ. تأكد من اتصالك بالإنترنت.");
    }
  }

  async function deleteOffer(offerId) {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذا العرض؟");

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "offers", offerId));
    } catch (error) {
      console.error(error);
      alert("تعذر حذف العرض. تأكد من اتصالك بالإنترنت.");
    }
  }

  return (
    <main className="page">
      <span className="page-label">لوحة التحكم</span>

      <h2>الإدارة</h2>

      <p>مرحبًا {staffUser?.username}، تقدر تدير القائمة والعروض من هنا.</p>

      <h3 style={{ marginTop: "40px" }}>تصدير بيانات العملاء</h3>

      <p>
        يقوم هذا الزر بتحميل ملف Excel يحتوي على اسم كل عميل، رقم جواله، تاريخ
        تسجيله، وعدد طلباته.
      </p>

      <button
        className="checkout-submit"
        style={{ maxWidth: "300px" }}
        onClick={exportCustomersToExcel}
        disabled={isExporting}
      >
        {isExporting ? "جارٍ التصدير..." : "📥 تصدير بيانات العملاء (Excel)"}
      </button>

      <h3 style={{ marginTop: "40px" }}>الوجبات المميزة بالصفحة الرئيسية</h3>

      <p>
        اختر حتى 3 وجبات تظهر في قسم "مقترحات" بالصفحة الرئيسية. إذا ما اخترت
        شيء، بتظهر أول 3 وجبات بالقائمة تلقائيًا.
      </p>

      <div className="checkout-cart" style={{ maxWidth: "500px" }}>
        {menuItems.map((item) => (
          <label
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 0",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={featuredIds.includes(item.id)}
              onChange={() => toggleFeatured(item.id)}
            />
            {item.name} — {item.price} ريال
          </label>
        ))}

        <button
          className="checkout-submit"
          style={{ marginTop: "15px" }}
          onClick={saveFeaturedItems}
          disabled={isSavingFeatured}
        >
          {isSavingFeatured ? "جارٍ الحفظ..." : "حفظ الوجبات المميزة"}
        </button>
      </div>

      <h3 style={{ marginTop: "40px" }}>إدارة القائمة</h3>

      <div className="checkout-layout">
        <div className="checkout-form">
          <h3>{editingItemId ? "تعديل صنف" : "إضافة صنف جديد"}</h3>

          <form onSubmit={saveItem}>
            <label>
              الاسم
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
              />
            </label>

            <label>
              التصنيف
              <select
                value={itemForm.category}
                onChange={(e) =>
                  setItemForm({ ...itemForm, category: e.target.value })
                }
              >
                <option>المعجنات</option>
                <option>الفطائر</option>
                <option>البيتزا</option>
              </select>
            </label>

            <label>
              الوصف
              <input
                type="text"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    description: e.target.value,
                  })
                }
              />
            </label>

            <label>
              السعر (ريال)
              <input
                type="number"
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm({ ...itemForm, price: e.target.value })
                }
              />
            </label>

            <label>
              رفع صورة الصنف
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleCloudinaryUpload(
                    e.target.files[0],
                    setItemForm,
                    setUploadingItemImage
                  )
                }
                disabled={uploadingItemImage}
              />
              {uploadingItemImage && (
                <span style={{ fontSize: "12px", color: "#28a745" }}>
                  جارٍ رفع الصورة...
                </span>
              )}
            </label>

            <label>
              رابط الصورة (سيتم ملؤه تلقائيًا عند الرفع)
              <input
                type="text"
                placeholder="/assets/images/اسم-الصورة.png أو رابط Cloudinary"
                value={itemForm.image}
                onChange={(e) =>
                  setItemForm({ ...itemForm, image: e.target.value })
                }
              />
            </label>

            {itemForm.image && (
              <div style={{ marginBottom: "15px" }}>
                <span style={{ fontSize: "12px", display: "block" }}>
                  معاينة الصورة:
                </span>
                <img
                  src={itemForm.image}
                  alt="معاينة الصنف"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginTop: "5px",
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              className="checkout-submit"
              disabled={uploadingItemImage}
            >
              {editingItemId ? "حفظ التعديل" : "إضافة الصنف"}
            </button>

            {editingItemId && (
              <button
                type="button"
                className="delete-order-button"
                style={{ width: "100%", marginTop: "10px" }}
                onClick={cancelItemForm}
              >
                إلغاء التعديل
              </button>
            )}
          </form>
        </div>

        <div className="checkout-cart">
          <h3>الأصناف الحالية ({menuItems.length})</h3>

          {menuItems.map((item) => (
            <div className="checkout-cart-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.category} — {item.price} ريال
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="next-status-button"
                  onClick={() => startEditItem(item)}
                >
                  تعديل
                </button>

                <button
                  className="delete-order-button"
                  onClick={() => deleteItem(item.id)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3 style={{ marginTop: "50px" }}>إدارة العروض</h3>

      <div className="checkout-layout">
        <div className="checkout-form">
          <h3>{editingOfferId ? "تعديل عرض" : "إضافة عرض جديد"}</h3>

          <form onSubmit={saveOffer}>
            <label>
              عنوان العرض
              <input
                type="text"
                value={offerForm.title}
                onChange={(e) =>
                  setOfferForm({ ...offerForm, title: e.target.value })
                }
              />
            </label>

            <label>
              الوصف
              <input
                type="text"
                value={offerForm.description}
                onChange={(e) =>
                  setOfferForm({
                    ...offerForm,
                    description: e.target.value,
                  })
                }
              />
            </label>

            <label>
              السعر (ريال)
              <input
                type="number"
                value={offerForm.price}
                onChange={(e) =>
                  setOfferForm({ ...offerForm, price: e.target.value })
                }
              />
            </label>

            <label>
              رفع صورة العرض
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleCloudinaryUpload(
                    e.target.files[0],
                    setOfferForm,
                    setUploadingOfferImage
                  )
                }
                disabled={uploadingOfferImage}
              />
              {uploadingOfferImage && (
                <span style={{ fontSize: "12px", color: "#28a745" }}>
                  جارٍ رفع الصورة...
                </span>
              )}
            </label>

            <label>
              رابط الصورة (سيتم ملؤه تلقائيًا عند الرفع)
              <input
                type="text"
                placeholder="/assets/images/اسم-الصورة.png أو رابط Cloudinary"
                value={offerForm.image}
                onChange={(e) =>
                  setOfferForm({ ...offerForm, image: e.target.value })
                }
              />
            </label>

            {offerForm.image && (
              <div style={{ marginBottom: "15px" }}>
                <span style={{ fontSize: "12px", display: "block" }}>
                  معاينة الصورة:
                </span>
                <img
                  src={offerForm.image}
                  alt="معاينة العرض"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginTop: "5px",
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              className="checkout-submit"
              disabled={uploadingOfferImage}
            >
              {editingOfferId ? "حفظ التعديل" : "إضافة العرض"}
            </button>

            {editingOfferId && (
              <button
                type="button"
                className="delete-order-button"
                style={{ width: "100%", marginTop: "10px" }}
                onClick={cancelOfferForm}
              >
                إلغاء التعديل
              </button>
            )}
          </form>
        </div>

        <div className="checkout-cart">
          <h3>العروض الحالية ({offers.length})</h3>

          {offers.map((offer) => (
            <div className="checkout-cart-item" key={offer.id}>
              <div>
                <strong>{offer.title}</strong>
                <span>{offer.price} ريال</span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="next-status-button"
                  onClick={() => startEditOffer(offer)}
                >
                  تعديل
                </button>

                <button
                  className="delete-order-button"
                  onClick={() => deleteOffer(offer.id)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Admin;