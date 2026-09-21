import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useLanguage } from "../i18n/LanguageContext";

function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useLanguage();

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
      setError(t("loginError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="staff-login-box">
        <span className="page-label">{t("staffLoginPageLabel")}</span>

        <h2>{t("staffLoginTitle")}</h2>

        <p>{t("staffLoginDescription")}</p>

        <form onSubmit={handleSubmit} className="staff-login-form">
          <label>
            {t("emailFieldLabel")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </label>

          <label>
            {t("passwordFieldLabel")}
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
            {isLoading ? t("loggingIn") : t("loginButton")}
          </button>
        </form>
      </div>
    </main>
  );
}

export default StaffLogin;