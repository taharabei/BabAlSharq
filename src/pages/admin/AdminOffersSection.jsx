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

const emptyOfferForm = {
  title: "",
  description: "",
  price: "",
  image: "",
};

function AdminOffersSection() {
  const [offers, setOffers] = useState([]);
  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [uploadingOfferImage, setUploadingOfferImage] = useState(false);

  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "offers"), (snapshot) => {
      setOffers(
        snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, []);

  async function handleImageUpload(file) {
    if (!file) return;

    setUploadingOfferImage(true);

    try {
      const url = await uploadToCloudinary(file);
      setOfferForm((prev) => ({ ...prev, image: url }));
    } catch (error) {
      console.error(error);
      alert(`${t("cloudinaryErrorPrefix")} ${t("cloudinaryErrorFallback")}`);
    } finally {
      setUploadingOfferImage(false);
    }
  }

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
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "offers", offerId));
    } catch (error) {
      console.error(error);
      alert(t("deleteOfferFailed"));
    }
  }

  return (
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
                setOfferForm({ ...offerForm, description: e.target.value })
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
              onChange={(e) => handleImageUpload(e.target.files[0])}
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
  );
}

export default AdminOffersSection;