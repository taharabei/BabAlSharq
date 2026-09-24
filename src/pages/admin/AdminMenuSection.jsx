import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const emptyItemForm = {
  name: "",
  category: "المعجنات",
  description: "",
  price: "",
  image: "",
};

function AdminMenuSection() {
  const [menuItems, setMenuItems] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);

  const { t } = useLanguage();

  const categoryLabels = {
    "المعجنات": t("categoryPastries"),
    "الفطائر": t("categoryPies"),
    "البيتزا": t("categoryPizza"),
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "menuItems"),
      (snapshot) => {
        setMenuItems(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }))
        );
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleImageUpload(file) {
    if (!file) return;

    setUploadingItemImage(true);

    try {
      const url = await uploadToCloudinary(file);
      setItemForm((prev) => ({ ...prev, image: url }));
    } catch (error) {
      console.error(error);
      alert(`${t("cloudinaryErrorPrefix")} ${t("cloudinaryErrorFallback")}`);
    } finally {
      setUploadingItemImage(false);
    }
  }

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
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "menuItems", itemId));
    } catch (error) {
      console.error(error);
      alert(t("deleteItemFailed"));
    }
  }

  return (
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
                setItemForm({ ...itemForm, description: e.target.value })
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
              onChange={(e) => handleImageUpload(e.target.files[0])}
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
  );
}

export default AdminMenuSection;