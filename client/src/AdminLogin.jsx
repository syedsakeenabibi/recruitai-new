
import { useState } from "react";
import "./AdminLogin.css";

export default function AdminLogin({
  onLogin,
  onBack,
  errorMessage = "",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Enter email and password.");
      return;
    }

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to sign in.");
        return;
      }

      onLogin(data.admin);
    } catch (error) {
      console.error("ADMIN AUTH ERROR:", error);
      alert("Unable to connect to the server.");
    }
  }

  return (
    <div className="admin-login-page">
      <button
        type="button"
        className="admin-back"
        onClick={onBack}
      >
        ← Back to website
      </button>

      <div className="admin-login-card">
        <div className="admin-login-logo">F</div>

        <p className="admin-eyebrow">
          FUSION STAFFING SOLUTIONS
        </p>

        <h1>Recruiter Portal</h1>

        <p className="admin-login-subtitle">
          Secure access for authorised administrators and recruiters.
        </p>

        {errorMessage && (
          <p className="admin-auth-error" role="alert">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-auth-tabs">
            <button
              type="button"
              className="active"
            >
              Sign In
            </button>
          </div>

          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            placeholder="admin@fusionstaffingsolutions.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            className="admin-login-button"
          >
            Sign In to Dashboard →
          </button>
        </form>

        <div className="admin-security-note">
          🔒 Authorised personnel only
        </div>
      </div>
    </div>
  );
}
