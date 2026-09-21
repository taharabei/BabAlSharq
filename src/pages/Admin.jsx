import { useState, useEffect } from "react";
import { db } from "../firebase";
import * as XLSX from "xlsx";
import { useLanguage } from "../i18n/LanguageContext";
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

  const { t } = useLanguage();

  const categoryLabels = {
    "المعجنات": t("categoryPastries"),
    "الفطائر": t("categoryPies"),
    "البيتزا": t("categoryPizza"),
  };

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
          `${t("cloudinaryErrorPrefix")} ${
            data.error?.message || t("cloudinaryErrorFallback")
          }`
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(t("imageUploadConnectionError"));
    } finally {
      setUploadingState(false);
    }
  }

  function toggleFeatured(itemId) {
    if (featuredIds.includes(itemId)) {
      setFeaturedIds(featuredIds.filter((id) => id !== itemId));
    } else {
      if (featuredIds.length >= 3) {
        alert(t("maxThreeFeatured"));
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

      alert(t("saveFeaturedSuccess"));
    } catch (error) {
      console.error(error);
      alert(t("saveGenericError"));
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
      alert(t("exportError"));
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
      alert(t("nameAndPriceRequired"));
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
      alert(t("saveGenericError"));
    }
  }

  async function deleteItem(itemId) {
    const confirmed = window.confirm(t("deleteItemConfirm"));

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "menuItems", itemId));
    } catch (error) {
      console.error(error);
      alert(t("deleteItemFailed"));
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
      alert(t("titleAndPriceRequired"));
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
      alert(t("saveGenericError"));
    }
  }

  async function deleteOffer(offerId) {
    const confirmed = window.confirm(t("deleteOfferConfirm2"));

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "offers", offerId));
    } catch (error) {
      console.error(error);
      alert(t("deleteOfferFailed"));
    }
  }

  return (
    <main className="page">
      <span className="page-label">{t("adminPageLabel")}</span>

      <h2>{t("adminTitle")}</h2>

      <p>
        {t("adminWelcomePrefix")} {staffUser?.username}
        {t("adminWelcomeSuffix")}
      </p>

      <h3 style={{ marginTop: "40px" }}>{t("exportCustomersTitle")}</h3>

      <p>{t("exportCustomersDescription")}</p>

      <button
        className="checkout-submit"
        style={{ maxWidth: "300px" }}
        onClick={exportCustomersToExcel}
        disabled={isExporting}
      >
        {isExporting ? t("exportingLabel") : t("exportCustomersButton")}
      </button>

      <h3 style={{ marginTop: "40px" }}>{t("featuredItemsTitle")}</h3>

      <p>{t("featuredItemsDescription")}</p>

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
            {item.name} — {item.price} {t("currency")}
          </label>
        ))}

        <button
          className="checkout-submit"
          style={{ marginTop: "15px" }}
          onClick={saveFeaturedItems}
          disabled={isSavingFeatured}
        >
          {isSavingFeatured ? t("savingLabel") : t("saveFeaturedButton")}
        </button>
      </div>

      <h3 style={{ marginTop: "40px" }}>{t("manageMenuTitle")}</h3>

      <div className="checkout-layout">
        <div className="checkout-form">
          <h3>{editingItemId ? t("editItemTitle") : t("addItemTitle")}</h3>

          <form onSubmit={saveItem}>
            <label>
              {t("nameFieldLabel")}
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
              />
            </label>

            <label>
              {t("categoryFieldLabel")}
              <select
                value={itemForm.category}
                onChange={(e) =>
                  setItemForm({ ...itemForm, category: e.target.value })
                }
              >
                <option value="المعجنات">{t("categoryPastries")}</option>
                <option value="الفطائر">{t("categoryPies")}</option>
                <option value="البيتزا">{t("categoryPizza")}</option>
              </select>
            </label>

            <label>
              {t("descriptionFieldLabel")}
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
              {t("priceFieldLabel")}
              <input
                type="number"
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm({ ...itemForm, price: e.target.value })
                }
              />
            </label>

            <label>
              {t("uploadItemImageLabel")}
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
                  {t("uploadingImageLabel")}
                </span>
              )}
            </label>

            <label>
              {t("imageUrlLabel")}
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
                  {t("imagePreviewLabel")}
                </span>
                <img
                  src={itemForm.image}
                  alt={t("itemPreviewAlt")}
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
              {editingItemId ? t("saveEditButton") : t("addItemButton")}
            </button>

            {editingItemId && (
              <button
                type="button"
                className="delete-order-button"
                style={{ width: "100%", marginTop: "10px" }}
                onClick={cancelItemForm}
              >
                {t("cancelEditButton")}
              </button>
            )}
          </form>
        </div>

        <div className="checkout-cart">
          <h3>
            {t("currentItemsPrefix")} ({menuItems.length})
          </h3>

          {menuItems.map((item) => (
            <div className="checkout-cart-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>
                  {categoryLabels[item.category] || item.category} —{" "}
                  {item.price} {t("currency")}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="next-status-button"
                  onClick={() => startEditItem(item)}
                >
                  {t("editButton")}
                </button>

                <button
                  className="delete-order-button"
                  onClick={() => deleteItem(item.id)}
                >
                  {t("deleteButton")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3 style={{ marginTop: "50px" }}>{t("manageOffersTitle")}</h3>

      <div className="checkout-layout">
        <div className="checkout-form">
          <h3>{editingOfferId ? t("editOfferTitle") : t("addOfferTitle")}</h3>

          <form onSubmit={saveOffer}>
            <label>
              {t("offerTitleFieldLabel")}
              <input
                type="text"
                value={offerForm.title}
                onChange={(e) =>
                  setOfferForm({ ...offerForm, title: e.target.value })
                }
              />
            </label>

            <label>
              {t("descriptionFieldLabel")}
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
              {t("priceFieldLabel")}
              <input
                type="number"
                value={offerForm.price}
                onChange={(e) =>
                  setOfferForm({ ...offerForm, price: e.target.value })
                }
              />
            </label>

            <label>
              {t("uploadOfferImageLabel")}
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
                  {t("uploadingImageLabel")}
                </span>
              )}
            </label>

            <label>
              {t("imageUrlLabel")}
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
                  {t("imagePreviewLabel")}
                </span>
                <img
                  src={offerForm.image}
                  alt={t("offerPreviewAlt")}
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
              {editingOfferId ? t("saveEditButton") : t("addOfferButton")}
            </button>

            {editingOfferId && (
              <button
                type="button"
                className="delete-order-button"
                style={{ width: "100%", marginTop: "10px" }}
                onClick={cancelOfferForm}
              >
                {t("cancelEditButton")}
              </button>
            )}
          </form>
        </div>

        <div className="checkout-cart">
          <h3>
            {t("currentOffersPrefix")} ({offers.length})
          </h3>

          {offers.map((offer) => (
            <div className="checkout-cart-item" key={offer.id}>
              <div>
                <strong>{offer.title}</strong>
                <span>
                  {offer.price} {t("currency")}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="next-status-button"
                  onClick={() => startEditOffer(offer)}
                >
                  {t("editButton")}
                </button>

                <button
                  className="delete-order-button"
                  onClick={() => deleteOffer(offer.id)}
                >
                  {t("deleteButton")}
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