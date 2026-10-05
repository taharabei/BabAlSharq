import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useLanguage } from "../i18n/LanguageContext";

const PHONE_REGEX = /^05\d{8}$/;

function CustomerLogin() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t } = useLanguage();
  const navigate = useNavigate();

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    setResetSent(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }

    if (!PHONE_REGEX.test(phone.trim())) {
      setError(t("phoneInvalid"));
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError(t("accountEmailRequired"));
      return;
    }

    if (password.length < 6) {
      setError(t("accountPasswordRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await setDoc(doc(db, "customerAccounts", credential.user.uid), {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        createdAt: new Date().toISOString(),
      });

      navigate("/");
    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        setError(t("accountEmailInUseError"));
      } else if (err.code === "auth/weak-password") {
        setError(t("accountWeakPasswordError"));
      } else {
        setError(t("accountGenericError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError(t("accountEmailRequired"));
      return;
    }

    if (!password) {
      setError(t("accountPasswordRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/");
    } catch (err) {
      console.error(err);

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError(t("accountInvalidCredentialsError"));
      } else {
        setError(t("accountGenericError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");

    if (!resetEmail.trim() || !resetEmail.includes("@")) {
      setError(t("accountEmailRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      console.error(err);

      if (err.code === "auth/user-not-found") {
        setError(t("resetPasswordUserNotFoundError"));
      } else {
        setError(t("accountGenericError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <span className="page-label">{t("accountPageLabel")}</span>

      <div className="staff-login-box">
        {mode !== "reset" && (
          <div className="account-tabs">
            <button
              type="button"
              className={
                "account-tab-button" + (mode === "login" ? " active" : "")
              }
              onClick={() => switchMode("login")}
            >
              {t("accountLoginTab")}
            </button>
            <button
              type="button"
              className={
                "account-tab-button" + (mode === "signup" ? " active" : "")
              }
              onClick={() => switchMode("signup")}
            >
              {t("accountSignupTab")}
            </button>
          </div>
        )}

        {mode === "reset" && <h3>{t("resetPasswordTitle")}</h3>}

        {error && (
          <p className="field-error" style={{ marginBottom: "14px" }}>
            {error}
          </p>
        )}

        {mode === "signup" && (
          <form className="staff-login-form" onSubmit={handleSignup}>
            <label>
              {t("nameFieldLabel")}
              <input
                type="text"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label>
              {t("phoneFieldLabel")}
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label>
              {t("accountEmailFieldLabel")}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              {t("accountPasswordFieldLabel")}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button
              className="checkout-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("accountCreatingLabel")
                : t("accountCreateButton")}
            </button>
          </form>
        )}

        {mode === "login" && (
          <>
            <form className="staff-login-form" onSubmit={handleLogin}>
              <label>
                {t("accountEmailFieldLabel")}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label>
                {t("accountPasswordFieldLabel")}
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <button
                className="checkout-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("accountLoggingInLabel")
                  : t("accountLoginButton")}
              </button>
            </form>

            <button
              type="button"
              className="account-forgot-link"
              onClick={() => switchMode("reset")}
            >
              {t("forgotPasswordLink")}
            </button>
          </>
        )}

        {mode === "reset" &&
          (resetSent ? (
            <div>
              <p>{t("resetPasswordSuccessMessage")}</p>
              <button
                type="button"
                className="account-guest-link"
                onClick={() => switchMode("login")}
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                {t("backToLoginLink")}
              </button>
            </div>
          ) : (
            <form className="staff-login-form" onSubmit={handleResetPassword}>
              <label>
                {t("accountEmailFieldLabel")}
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </label>

              <button
                className="checkout-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t("resetPasswordSendingLabel")
                  : t("resetPasswordButton")}
              </button>

              <button
                type="button"
                className="account-guest-link"
                onClick={() => switchMode("login")}
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                {t("backToLoginLink")}
              </button>
            </form>
          ))}

        <Link to="/" className="account-guest-link">
          {t("accountContinueAsGuestButton")}
        </Link>
      </div>
    </main>
  );
}

export default CustomerLogin;