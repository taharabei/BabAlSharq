import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { useLanguage } from "../../i18n/LanguageContext";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";

function AdminFeaturedSection() {
  const [menuItems, setMenuItems] = useState([]);
  const [featuredIds, setFeaturedIds] = useState([]);
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);

  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribeItems = onSnapshot(
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
      unsubscribeSettings();
    };
  }, []);

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
      await setDoc(
        doc(db, "settings", "home"),
        { featuredItemIds: featuredIds },
        { merge: true }
      );
      alert(t("saveFeaturedSuccess"));
    } catch (error) {
      console.error(error);
      alert(t("saveGenericError"));
    } finally {
      setIsSavingFeatured(false);
    }
  }

  return (
    <div className="checkout-cart" style={{ maxWidth: "500px" }}>
      <p style={{ marginBottom: "15px" }}>{t("featuredItemsDescription")}</p>

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
  );
}

export default AdminFeaturedSection;