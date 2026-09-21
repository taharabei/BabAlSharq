import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      // بعد نجاح الدخول، التطبيق يتعرف على المستخدم تلقائيًا
    } catch (err) {
      console.error(err);
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="staff-login-box">
        <span className="page-label">دخول الموظفين</span>

        <h2>تسجيل الدخول</h2>

        <p>هذه الشاشة مخصصة لموظفي الفروع والإدارة فقط.</p>

        <form onSubmit={handleSubmit} className="staff-login-form">
          <label>
            البريد الإلكتروني
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <button
            type="submit"
            className="checkout-submit"
            disabled={isLoading}
          >
            {isLoading ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default StaffLogin;