import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { staffProfiles } from "./staffAccounts";
import { useLanguage } from "./i18n/LanguageContext";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Offers from "./pages/Offers";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Checkout from "./pages/Checkout";
import StaffLogin from "./pages/StaffLogin";
import Admin from "./pages/Admin";
import RetrieveCoupon from "./pages/RetrieveCoupon";

import "./App.css";

const staffOnlyPaths = ["/orders", "/customers", "/admin"];

// ===== كشف آيفون + عرض رسالة التثبيت =====

function isIosDevice() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

function isAlreadyInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("iosInstallBannerDismissed");

    if (isIosDevice() && !isAlreadyInstalled() && !dismissed) {
      setVisible(true);
    }
  }, []);

  function closeBanner() {
    setVisible(false);
    localStorage.setItem("iosInstallBannerDismissed", "true");
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        zIndex: 1000,
        background: "#1f8a4c",
        color: "#fff",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.2)",
        fontSize: "14px",
        lineHeight: "1.6",
      }}
    >
      <span>
        لتثبيت التطبيق على شاشتك الرئيسية: اضغط زر المشاركة{" "}
        <strong>📤</strong> بالأسفل، ثم اختر{" "}
        <strong>"إضافة إلى الشاشة الرئيسية"</strong>.
      </span>

      <button
        onClick={closeBanner}
        aria-label="إغلاق"
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "18px",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ===== شريط التنقل السفلي (للعميل فقط، على الجوال) =====

function BottomNav({ cart, t }) {
  const location = useLocation();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const items = [
    { to: "/", icon: "🏠", label: t("navHome") },
    { to: "/menu", icon: "📋", label: t("navMenu") },
    { to: "/offers", icon: "🎁", label: t("navOffers") },
    { to: "/checkout", icon: "🛒", label: t("navCart") },
  ];

  return (
    <nav className="bottom-nav is-visible">
      {items.map((item) => (
        <Link
          to={item.to}
          key={item.to}
          className={
            "bottom-nav-item" +
            (location.pathname === item.to ? " is-active" : "")
          }
        >
          <span>{item.icon}</span>
          {item.label}
          {item.to === "/checkout" && cartCount > 0 && (
            <span className="bottom-nav-cart-badge">{cartCount}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function AppLayout({ staffUser, handleLogout, cart, setCart, isAuthLoading }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { dir, toggleLanguage, t, language } = useLanguage();

  const isStaffLoginScreen =
    !staffUser && staffOnlyPaths.includes(location.pathname);

  if (isAuthLoading) {
    return (
      <div className="app" dir={dir}>
        <main className="page">
          <p>{t("loading")}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app" dir={dir}>

      <header className="header">
        <Link to="/" className="logo">
          <span className="logo-mark">
            <img src="/logo.jpg" alt={t("brandName")} />
          </span>

          <div>
            <h1>{t("brandName")}</h1>
            <span>{t("brandNameEn")}</span>
          </div>
        </Link>

        {!isStaffLoginScreen && (
          <>
            <nav className={menuOpen ? "nav nav-open" : "nav"}>
              {!staffUser && (
                <>
                  <Link to="/" onClick={() => setMenuOpen(false)}>
                    {t("navHome")}
                  </Link>
                  <Link to="/menu" onClick={() => setMenuOpen(false)}>
                    {t("navMenu")}
                  </Link>
                  <Link to="/offers" onClick={() => setMenuOpen(false)}>
                    {t("navOffers")}
                  </Link>
                  <Link
                    to="/retrieve-coupon"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("navRetrieveCoupon")}
                  </Link>
                </>
              )}

              {staffUser && (
                <>
                  <Link to="/orders" onClick={() => setMenuOpen(false)}>
                    {t("navOrders")}
                  </Link>
                  <Link
                    to="/customers"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("navCustomers")}
                  </Link>
                  <Link to="/offers" onClick={() => setMenuOpen(false)}>
                    {t("navCheckCoupon")}
                  </Link>

                  {staffUser.role === "admin" && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t("navAdmin")}
                      </Link>
                      <Link
                        to="/"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t("navHome")}
                      </Link>
                      <Link
                        to="/menu"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t("navMenu")}
                      </Link>
                    </>
                  )}

                  <button
                    className="staff-logout-link"
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                  >
                    {t("logoutPrefix")} (
                    {staffUser.branch === "admin"
                      ? t("admin")
                      : staffUser.branch}
                    )
                  </button>
                </>
              )}

              <button
                className="lang-toggle-button"
                onClick={toggleLanguage}
                style={{
                  background: "transparent",
                  border: "1px solid currentColor",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                {language === "ar" ? "EN" : "عربي"}
              </button>
            </nav>

            <button
              className="menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t("openMenu")}
            >
              ☰
            </button>
          </>
        )}
      </header>

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/menu"
          element={
            <Menu
              cart={cart}
              setCart={setCart}
            />
          }
        />

        <Route
          path="/offers"
          element={
            <Offers
              cart={cart}
              setCart={setCart}
              staffUser={staffUser}
            />
          }
        />

        <Route
          path="/orders"
          element={
            staffUser ? (
              <Orders staffUser={staffUser} />
            ) : (
              <StaffLogin />
            )
          }
        />

        <Route
          path="/customers"
          element={
            staffUser ? (
              <Customers staffUser={staffUser} />
            ) : (
              <StaffLogin />
            )
          }
        />

        <Route
          path="/admin"
          element={
            staffUser?.role === "admin" ? (
              <Admin staffUser={staffUser} />
            ) : staffUser ? (
              <Orders staffUser={staffUser} />
            ) : (
              <StaffLogin />
            )
          }
        />

        <Route
          path="/checkout"
          element={
            <Checkout
              cart={cart}
              setCart={setCart}
            />
          }
        />

        <Route
          path="/retrieve-coupon"
          element={<RetrieveCoupon />}
        />
      </Routes>

      {!staffUser && <IosInstallBanner />}

      {!staffUser && !isStaffLoginScreen && (
        <BottomNav cart={cart} t={t} />
      )}

    </div>
  );
}

function App() {
  const [cart, setCart] = useState([]);
  const [staffUser, setStaffUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && staffProfiles[user.uid]) {
        setStaffUser({
          uid: user.uid,
          email: user.email,
          ...staffProfiles[user.uid],
        });
      } else {
        setStaffUser(null);
      }

      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  }

  return (
    <BrowserRouter>
      <AppLayout
        staffUser={staffUser}
        handleLogout={handleLogout}
        cart={cart}
        setCart={setCart}
        isAuthLoading={isAuthLoading}
      />
    </BrowserRouter>
  );
}

export default App;