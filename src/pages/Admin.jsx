import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import AdminMenuSection from "./admin/AdminMenuSection";
import AdminOffersSection from "./admin/AdminOffersSection";
import AdminFeaturedSection from "./admin/AdminFeaturedSection";
import AdminExportSection from "./admin/AdminExportSection";
import AdminHomeContentSection from "./admin/AdminHomeContentSection";

function Admin({ staffUser }) {
  const [activeSection, setActiveSection] = useState(null);
  const { t } = useLanguage();

  const cards = [
    {
      id: "homeContent",
      icon: "🏠",
      title: t("homeContentTitle"),
      description: t("homeContentCardDescription"),
      component: <AdminHomeContentSection />,
    },
    {
      id: "menu",
      icon: "🍽️",
      title: t("manageMenuTitle"),
      description: t("menuCardDescription"),
      component: <AdminMenuSection />,
    },
    {
      id: "offers",
      icon: "🎁",
      title: t("manageOffersTitle"),
      description: t("offersCardDescription"),
      component: <AdminOffersSection />,
    },
    {
      id: "featured",
      icon: "⭐",
      title: t("featuredItemsTitle"),
      description: t("featuredCardDescription"),
      component: <AdminFeaturedSection />,
    },
    {
      id: "export",
      icon: "📥",
      title: t("exportCustomersTitle"),
      description: t("exportCardDescription"),
      component: <AdminExportSection />,
    },
  ];

  const activeCard = cards.find((card) => card.id === activeSection);

  if (activeCard) {
    return (
      <main className="page">
        <div className="admin-section-header">
          <button
            className="admin-back-button"
            onClick={() => setActiveSection(null)}
          >
            {t("backToDashboardButton")}
          </button>

          <h2>
            {activeCard.icon} {activeCard.title}
          </h2>
        </div>

        {activeCard.component}
      </main>
    );
  }

  return (
    <main className="page">
      <p>
        {t("adminWelcomePrefix")} {staffUser?.username}
        {t("adminWelcomeSuffix")}
      </p>

      <div className="admin-dashboard-grid">
        {cards.map((card) => (
          <button
            key={card.id}
            className="admin-dashboard-card"
            onClick={() => setActiveSection(card.id)}
          >
            <span className="admin-dashboard-icon">{card.icon}</span>
            <strong>{card.title}</strong>
            <span className="admin-dashboard-desc">{card.description}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

export default Admin;