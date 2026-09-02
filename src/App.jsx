import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Offers from "./pages/Offers";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app" dir="rtl">

        <header className="header">
          <Link to="/" className="logo">
            <span className="logo-mark">ب</span>

            <div>
              <h1>باب الشرق</h1>
              <span>BabAlSharq</span>
            </div>
          </Link>

          <nav className="nav">
            <Link to="/">الرئيسية</Link>
            <Link to="/menu">القائمة</Link>
            <Link to="/offers">العروض</Link>
            <Link to="/orders">الطلبات</Link>
            <Link to="/customers">العملاء</Link>
          </nav>

          <Link to="/orders" className="order-button">
            الطلبات
          </Link>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;