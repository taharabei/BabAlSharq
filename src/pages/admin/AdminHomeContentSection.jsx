import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import { useLanguage } from "../../i18n/LanguageContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const emptyContent = {
  ar: { heroTitleLine1: "", heroTitleLine2: "", heroDescription: "", heroButton: "" },
  en: { heroTitleLine1: "", heroTitleLine2: "", heroDescription: "", heroButton: "" },
};

const MAX_BANNERS = 4;

function AdminHomeContentSection() {
  const [content, setContent] = useState(emptyContent);
  const [banners, setBanners] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "home"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        if (data.homeContent) {
          setContent((prev) => ({
            ar: { ...prev.ar, ...data.homeContent.ar },
            en: { ...prev.en, ...data.homeContent.en },
          }));
        }

        setBanners(data.heroBanners || []);
      }
    });

    return () => unsubscribe();
  }, []);

  function updateField(lang, field, value) {
    setContent((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value },
    }));
  }

  async function handleBannerUpload(file) {
    if (!file) return;

    if (banners.length >= MAX_BANNERS) {
      alert(t("maxBannersReached"));
      return;
    }

    setIsUploadingBanner(true);

    try {
      const url = await uploadToCloudinary(file);
      setBanners((prev) => [...prev, url]);
    } catch (error) {
      console.error(error);
      alert(`${t("cloudinaryErrorPrefix")} ${t("cloudinaryErrorFallback")}`);
    } finally {
      setIsUploadingBanner(false);
    }
  }

  function removeBanner(index) {
    setBanners((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveAll() {
    setIsSaving(true);

    try {
      await setDoc(
        doc(db, "settings", "home"),
        { homeContent: content, heroBanners: banners },
        { merge: true }
      );
      alert(t("saveHomeContentSuccess"));
    } catch (error) {
      console.error(error);
      alert(t("saveGenericError"));
    } finally {
      setIsSaving(false);
    }
  }

  function renderLangFields(lang, langLabel) {
    return (
      <div className="checkout-form" style={{ marginBottom: "20px" }}>
        <h3>{langLabel}</h3>

        <label>
          {t("heroLine1FieldLabel")}
          <input
            type="text"
            value={content[lang].heroTitleLine1}
            onChange={(e) => updateField(lang, "heroTitleLine1", e.target.value)}
          />
        </label>

        <label>
          {t("heroLine2FieldLabel")}
          <input
            type="text"
            value={content[lang].heroTitleLine2}
            onChange={(e) => updateField(lang, "heroTitleLine2", e.target.value)}
          />
        </label>

        <label>
          {t("heroDescriptionFieldLabel")}
          <textarea
            value={content[lang].heroDescription}
            onChange={(e) =>
              updateField(lang, "heroDescription", e.target.value)
            }
          />
        </label>

        <label>
          {t("heroButtonFieldLabel")}
          <input
            type="text"
            value={content[lang].heroButton}
            onChange={(e) => updateField(lang, "heroButton", e.target.value)}
          />
        </label>
      </div>
    );
  }

  return (
    <div>
      <div className="checkout-form" style={{ marginBottom: "20px" }}>
        <h3>{t("bannerManagementTitle")}</h3>

        <p style={{ marginBottom: "15px", color: "var(--color-text-muted)" }}>
          {t("bannersDescription")}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "15px",
          }}
        >
          {banners.map((url, index) => (
            <div
              key={index}
              style={{
                position: "relative",
                width: "120px",
                height: "80px",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
              }}
            >
              <img
                src={url}
                alt={`banner-${index}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <button
                type="button"
                onClick={() => removeBanner(index)}
                style={{
                  position: "absolute",
                  top: "4px",
                  left: "4px",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  width: "22px",
                  height: "22px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {banners.length < MAX_BANNERS ? (
          <label>
            {t("uploadBannerImageLabel")} ({banners.length}/{MAX_BANNERS})
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleBannerUpload(e.target.files[0])}
              disabled={isUploadingBanner}
            />
            {isUploadingBanner && (
              <span style={{ fontSize: "12px", color: "#28a745" }}>
                {t("uploadingImageLabel")}
              </span>
            )}
          </label>
        ) : (
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            {t("maxBannersReached")}
          </p>
        )}
      </div>

      <p style={{ marginBottom: "20px" }}>{t("homeContentDescription")}</p>

      {renderLangFields("ar", "🇸🇦 " + t("arabicLabel"))}
      {renderLangFields("en", "🇬🇧 " + t("englishLabel"))}

      <button
        className="checkout-submit"
        style={{ maxWidth: "300px" }}
        onClick={saveAll}
        disabled={isSaving}
      >
        {isSaving ? t("savingLabel") : t("saveHomeContentButton")}
      </button>
    </div>
  );
}

export default AdminHomeContentSection;