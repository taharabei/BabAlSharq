import { useState } from "react";
import staffAccounts from "../staffAccounts";

function StaffLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const account = staffAccounts.find(
      (acc) =>
        acc.username === username.trim() &&
        acc.password === password
    );

    if (!account) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      return;
    }

    setError("");
    onLogin(account);
  }

  return (
    <main className="page">
      <div className="staff-login-box">
        <span className="page-label">دخول الموظفين</span>

        <h2>تسجيل الدخول</h2>

        <p>هذه الشاشة مخصصة لموظفي الفروع والإدارة فقط.</p>

        <form onSubmit={handleSubmit} className="staff-login-form">
          <label>
            اسم المستخدم
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </label>

          <label>
            كلمة المرور
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <span className="field-error">{error}</span>}

          <button type="submit" className="checkout-submit">
            دخول
          </button>
        </form>
      </div>
    </main>
  );
}

export default StaffLogin;