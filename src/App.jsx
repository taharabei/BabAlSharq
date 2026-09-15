import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

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

function App() {
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const [staffUser, setStaffUser] = useState(() => {
    const saved = localStorage.getItem("staffUser");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (staffUser) {
      localStorage.setItem("staffUser", JSON.stringify(staffUser));
    } else {
      localStorage.removeItem("staffUser");
    }
  }, [staffUser]);

  function handleLogin(account) {
    setStaffUser(account);
  }

  function handleLogout() {
    setStaffUser(null);
  }

  return (
    <BrowserRouter>
      <div className="app" dir="rtl">

        <header className="header">
          <Link to="/" className="logo">
            <span className="logo-mark">
              <img src="/logo.jpg" alt="بابل للمعجنات" />
            </span>

            <div>
              <h1>بابل للمعجنات</h1>
              <span>Babel Pastries</span>
            </div>
          </Link>

          <nav className={menuOpen ? "nav nav-open" : "nav"}>
            {!staffUser && (
              <>
                <Link to="/" onClick={() => setMenuOpen(false)}>
                  الرئيسية
                </Link>
                <Link to="/menu" onClick={() => setMenuOpen(false)}>
                  القائمة
                </Link>
                <Link to="/offers" onClick={() => setMenuOpen(false)}>
                  العروض
                </Link>
                <Link
                  to="/retrieve-coupon"
                  onClick={() => setMenuOpen(false)}
                >
                  استرجاع الكوبون
                </Link>
                <Link
                  to="/orders"
                  className="staff-entry-link"
                  onClick={() => setMenuOpen(false)}
                >
                  دخول الموظفين
                </Link>
              </>
            )}

              {staffUser && (
              <>
                <Link to="/orders" onClick={() => setMenuOpen(false)}>
                  الطلبات
                </Link>
                <Link to="/customers" onClick={() => setMenuOpen(false)}>
                  العملاء
                </Link>
                <Link to="/offers" onClick={() => setMenuOpen(false)}>
                  تحقق من الكوبون
                </Link>

                {staffUser.role === "admin" && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)}>
                    لوحة التحكم
                  </Link>
                )}

                <button
                  className="staff-logout-link"
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                >
                  خروج ({staffUser.branch === "admin" ? "المدير" : staffUser.branch})
                </button>
              </>
            )}
          </nav>

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="فتح القائمة"
          >
            ☰
          </button>
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
                <StaffLogin onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/customers"
            element={
              staffUser ? (
                <Customers staffUser={staffUser} />
              ) : (
                <StaffLogin onLogin={handleLogin} />
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
                <StaffLogin onLogin={handleLogin} />
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

      </div>
    </BrowserRouter>
  );
}

export default App;