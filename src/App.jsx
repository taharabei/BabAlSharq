import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { staffProfiles } from "./staffAccounts";
import { useLanguage } from "./i18n/LanguageContext";
import { subscribeToPushNotifications } from "./push";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Offers from "./pages/Offers";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Checkout from "./pages/Checkout";
import StaffLogin from "./pages/StaffLogin";
import Admin from "./pages/Admin";
import RetrieveCoupon from "./pages/RetrieveCoupon";
import CustomerLogin from "./pages/CustomerLogin";
import MyOrders from "./pages/MyOrders";

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

// ===== الشريط الجانبي (يحل محل القائمة المنسدلة القديمة) =====

function Sidebar({
  menuOpen,
  setMenuOpen,
  staffUser,
  customerUser,
  handleLogout,
  t,
  language,
  toggleLanguage,
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(
      localStorage.getItem("pushNotificationsEnabled") === "true"
    );
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleEnableNotifications() {
    setIsSubscribing(true);

    const result = await subscribeToPushNotifications(customerUser?.uid);

    if (result.success) {
      localStorage.setItem("pushNotificationsEnabled", "true");
      setNotificationsEnabled(true);
      alert(t("notificationsEnabledSuccess"));
    } else if (result.reason === "denied") {
      alert(t("notificationsPermissionDenied"));
    } else if (result.reason === "unsupported") {
      alert(t("notificationsUnsupportedError"));
    } else {
      alert(t("notificationsGenericError"));
    }

    setIsSubscribing(false);
  }

  return (
    <>
      <div
        className={
          "sidebar-overlay" + (menuOpen ? " is-visible" : "")
        }
        onClick={closeMenu}
      />

      <aside className={"sidebar" + (menuOpen ? " is-open" : "")}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.jpg" alt={t("brandName")} />
            <span>{t("brandName")}</span>
          </div>

          <button
            className="sidebar-close"
            onClick={closeMenu}
            aria-label={t("openMenu")}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {!staffUser && (
            <>
              <Link to="/" onClick={closeMenu}>
                <span>🏠</span>
                {t("navHome")}
              </Link>
              <Link to="/menu" onClick={closeMenu}>
                <span>📋</span>
                {t("navMenu")}
              </Link>
              <Link to="/offers" onClick={closeMenu}>
                <span>🎁</span>
                {t("navOffers")}
              </Link>
              <Link to="/retrieve-coupon" onClick={closeMenu}>
                <span>🎫</span>
                {t("navRetrieveCoupon")}
              </Link>
              <Link to="/my-orders" onClick={closeMenu}>
                <span>🧾</span>
                {t("navMyOrders")}
              </Link>

              <button
                type="button"
                className="sidebar-nav-button"
                onClick={handleEnableNotifications}
                disabled={notificationsEnabled || isSubscribing}
              >
                <span>🔔</span>
                {notificationsEnabled
                  ? t("notificationsEnabledButton")
                  : t("enableNotificationsButton")}
              </button>

              {customerUser ? (
                <div className="sidebar-customer-info">
                  <span>👤</span>
                  {customerUser.name || customerUser.email}
                </div>
              ) : (
                <Link to="/account" onClick={closeMenu}>
                  <span>👤</span>
                  {t("navAccount")}
                </Link>
              )}
            </>
          )}

          {staffUser && (
            <>
              <Link to="/orders" onClick={closeMenu}>
                <span>🧾</span>
                {t("navOrders")}
              </Link>
              <Link to="/customers" onClick={closeMenu}>
                <span>👥</span>
                {t("navCustomers")}
              </Link>
              <Link to="/offers" onClick={closeMenu}>
                <span>🎁</span>
                {t("navCheckCoupon")}
              </Link>

              {staffUser.role === "admin" && (
                <>
                  <Link to="/admin" onClick={closeMenu}>
                    <span>⚙️</span>
                    {t("navAdmin")}
                  </Link>
                  <Link to="/" onClick={closeMenu}>
                    <span>🏠</span>
                    {t("navHome")}
                  </Link>
                  <Link to="/menu" onClick={closeMenu}>
                    <span>📋</span>
                    {t("navMenu")}
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-lang-button" onClick={toggleLanguage}>
            🌐 {language === "ar" ? "English" : "العربية"}
          </button>

          {(staffUser || customerUser) && (
            <button
              className="sidebar-logout-button"
              onClick={() => {
                handleLogout();
                closeMenu();
              }}
            >
              🚪 {t("logoutPrefix")}
              {staffUser &&
                ` (${
                  staffUser.branch === "admin" ? t("admin") : staffUser.branch
                })`}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function AppLayout({
  staffUser,
  customerUser,
  handleLogout,
  cart,
  setCart,
  isAuthLoading,
}) {
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
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("openMenu")}
          >
            ☰
          </button>
        )}
      </header>

      {!isStaffLoginScreen && (
        <Sidebar
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          staffUser={staffUser}
          customerUser={customerUser}
          handleLogout={handleLogout}
          t={t}
          language={language}
          toggleLanguage={toggleLanguage}
        />
      )}

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
              customerUser={customerUser}
            />
          }
        />

        <Route
          path="/retrieve-coupon"
          element={<RetrieveCoupon />}
        />

        <Route
          path="/account"
          element={<CustomerLogin />}
        />

        <Route
          path="/my-orders"
          element={<MyOrders customerUser={customerUser} />}
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
  const [customerUser, setCustomerUser] = useState(null);
  const [customerAuthUid, setCustomerAuthUid] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && staffProfiles[user.uid]) {
        setStaffUser({
          uid: user.uid,
          email: user.email,
          ...staffProfiles[user.uid],
        });
        setCustomerAuthUid(null);
        setCustomerUser(null);
      } else if (user) {
        setStaffUser(null);
        setCustomerAuthUid(user.uid);
        setCustomerUser((prev) =>
          prev && prev.uid === user.uid
            ? prev
            : { uid: user.uid, email: user.email, name: "" }
        );
      } else {
        setStaffUser(null);
        setCustomerAuthUid(null);
        setCustomerUser(null);
      }

      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ===== متابعة بيانات حساب العميل (اسم/جوال) بشكل حي =====
  useEffect(() => {
    if (!customerAuthUid) return;

    const unsubscribe = onSnapshot(
      doc(db, "customerAccounts", customerAuthUid),
      (docSnap) => {
        if (docSnap.exists()) {
          setCustomerUser({ uid: customerAuthUid, ...docSnap.data() });
        }
      }
    );

    return () => unsubscribe();
  }, [customerAuthUid]);

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
        customerUser={customerUser}
        handleLogout={handleLogout}
        cart={cart}
        setCart={setCart}
        isAuthLoading={isAuthLoading}
      />
    </BrowserRouter>
  );
}

export default App;