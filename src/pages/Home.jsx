import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { useLanguage } from "../i18n/LanguageContext";

const categoryIcons = {
  "المعجنات": "🥐",
  "الفطائر": "🥧",
  "البيتزا": "🍕",
};

function Home() {
  const [allItems, setAllItems] = useState([]);
  const [featuredIds, setFeaturedIds] = useState([]);
  const [offers, setOffers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [homeContent, setHomeContent] = useState(null);
  const [heroBanners, setHeroBanners] = useState([]);

  const { t, language } = useLanguage();

  useEffect(() => {
    const unsubscribeItems = onSnapshot(
      collection(db, "menuItems"),
      (snapshot) => {
        const items = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setAllItems(items);
      }
    );

    const unsubscribeSettings = onSnapshot(
      doc(db, "settings", "home"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFeaturedIds(data.featuredItemIds || []);
          setHomeContent(data.homeContent || null);
          setHeroBanners(data.heroBanners || []);
        } else {
          setFeaturedIds([]);
          setHomeContent(null);
          setHeroBanners([]);
        }
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

    return () => {
      unsubscribeItems();
      unsubscribeSettings();
      unsubscribeOffers();
    };
  }, []);

  // ===== نص هجين: قيمة الأدمن إن وجدت، وإلا النص الافتراضي =====
  function heroText(field, fallbackKey) {
    const override = homeContent?.[language]?.[field];
    return override && override.trim() ? override : t(fallbackKey);
  }

  // ===== التحية حسب الوقت =====
  const currentHour = new Date().getHours();
  const greeting =
    currentHour >= 5 && currentHour < 17
      ? t("greetingMorning")
      : t("greetingEvening");

  // ===== الوجبات المميزة =====
  const featuredItems =
    featuredIds.length > 0
      ? featuredIds
          .map((id) => allItems.find((item) => item.id === id))
          .filter(Boolean)
      : allItems.slice(0, 3);

  // ===== الأكثر طلباً (مؤقتاً: أصناف غير مميزة، بانتظار عداد حقيقي) =====
  const mostOrderedItems = allItems
    .filter((item) => !featuredItems.some((f) => f.id === item.id))
    .slice(0, 6);

  // ===== البحث =====
  const query = searchQuery.trim().toLowerCase();
  const searchResults = query
    ? [
        ...allItems
          .filter((item) => item.name?.toLowerCase().includes(query))
          .map((item) => ({ ...item, _type: "item" })),
        ...offers
          .filter((offer) => offer.title?.toLowerCase().includes(query))
          .map((offer) => ({ ...offer, _type: "offer" })),
      ]
    : [];

  // ===== بانر الأدمن المتحرك (صور فقط) =====
  useEffect(() => {
    if (heroBanners.length < 2) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroBanners.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [heroBanners.length]);

  return (
    <main className="home-page">

      <p className="greeting-bar">{greeting} 👋</p>

      <div className="home-search">
        <div className="home-search-input-wrap">
          <span>🔍</span>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {query && (
          <div style={{ marginTop: "12px" }}>
            {searchResults.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)" }}>
                {t("searchNoResults")}
              </p>
            ) : (
              <div className="most-ordered-scroll" style={{ flexWrap: "wrap" }}>
                {searchResults.map((result) => (
                  <Link
                    to={result._type === "offer" ? "/offers" : "/menu"}
                    className="most-ordered-card"
                    key={`${result._type}-${result.id}`}
                  >
                    <div className="most-ordered-image">
                      {result.image && (
                        <img
                          src={result.image}
                          alt={result.name || result.title}
                        />
                      )}
                    </div>
                    <div className="most-ordered-info">
                      <h4>{result.name || result.title}</h4>
                      <strong>
                        {result.price} {t("currency")}
                      </strong>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!query && (
        <>
          {heroBanners.length > 0 ? (
            <div className="hero-carousel">
              <div className="hero-carousel-track hero-carousel-track-image-only">
                {heroBanners.map((url, index) => (
                  <Link
                    to="/offers"
                    className={
                      "hero-carousel-slide hero-carousel-slide-image-only" +
                      (index === activeSlide ? " is-active" : "")
                    }
                    key={index}
                  >
                    <img src={url} alt={`banner-${index}`} />
                  </Link>
                ))}
              </div>

              {heroBanners.length > 1 && (
                <div className="carousel-dots">
                  {heroBanners.map((_, index) => (
                    <button
                      key={index}
                      className={index === activeSlide ? "is-active" : ""}
                      onClick={() => setActiveSlide(index)}
                      aria-label={`slide-${index}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <section className="hero-section">
              <div className="hero-content">
                <span className="hero-label">{t("heroLabel")}</span>

                <h2>
                  {heroText("heroTitleLine1", "heroTitleLine1")}
                  <br />
                  {heroText("heroTitleLine2", "heroTitleLine2")}
                </h2>

                <p>{heroText("heroDescription", "heroDescription")}</p>

                <Link to="/menu" className="hero-button">
                  {heroText("heroButton", "heroButton")}
                </Link>
              </div>

              <div className="hero-placeholder">
                <img src="/logo.jpg" alt={t("brandName")} />
              </div>
            </section>
          )}

          <div className="category-chips">
            {Object.entries(categoryIcons).map(([category, icon]) => (
              <Link to="/menu" className="category-chip" key={category}>
                <span>{icon}</span>
                {category}
              </Link>
            ))}
          </div>

          {mostOrderedItems.length > 0 && (
            <section className="home-section">
              <div className="section-heading">
                <span>{t("mostOrderedLabel")}</span>
                <h3>{t("mostOrderedTitle")}</h3>
              </div>

              <div className="most-ordered-scroll">
                {mostOrderedItems.map((item) => (
                  <Link
                    to="/menu"
                    className="most-ordered-card"
                    key={item.id}
                  >
                    <div className="most-ordered-image">
                      {item.image && (
                        <img src={item.image} alt={item.name} />
                      )}
                    </div>
                    <div className="most-ordered-info">
                      <span className="most-ordered-badge">
                        {t("mostOrderedLabel")}
                      </span>
                      <h4>{item.name}</h4>
                      <strong>
                        {item.price} {t("currency")}
                      </strong>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {featuredItems.length > 0 && (
            <section className="home-section">
              <div className="section-heading">
                <span>{t("suggestionsLabel")}</span>
                <h3>{t("featuredTitle")}</h3>
              </div>

              <div className="products-preview">
                {featuredItems.map((item) => (
                  <Link
                    to="/menu"
                    className="product-card"
                    key={item.id}
                  >
                    <div className="product-image">
                      <img src={item.image} alt={item.name} />
                    </div>

                    <div className="product-info">
                      <h4>{item.name}</h4>
                      <p>{item.description}</p>
                      <strong>
                        {item.price} {t("currency")}
                      </strong>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

    </main>
  );
}

export default Home;