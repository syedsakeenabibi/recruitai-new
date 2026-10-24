import { useState } from "react";
import "./AdminLogin.css";

export default function AdminLogin({ onLogin, onBack, errorMessage = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
const [name, setName] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

 async function handleSubmit(e) {
  e.preventDefault();

  if (mode === "signup") {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Enter your name, email and password.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
  } else {
    if (!email.trim() || !password.trim()) {
      alert("Enter email and password.");
      return;
    }
  }

  try {
    const endpoint =
      mode === "signup"
        ? "/api/admin/signup"
        : "/api/admin/login";

    const body =
      mode === "signup"
        ? {
            name: name.trim(),
            email: email.trim(),
            password,
          }
        : {
            email: email.trim(),
            password,
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Something went wrong.");
      return;
    }

    if (mode === "signup") {
      alert("Account created successfully. Please sign in.");

      setMode("signin");
      setName("");
      setPassword("");
      setConfirmPassword("");
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
      <button className="admin-back" onClick={onBack}>
        ← Back to website
      </button>

      <div className="admin-login-card">
        <div className="admin-login-logo">F</div>

        <p className="admin-eyebrow">FUSION STAFFING SOLUTIONS</p>

        <h1>Recruiter Portal</h1>

        <p className="admin-login-subtitle">
          Secure access for authorised administrators and recruiters.
        </p>

        {errorMessage && <p className="admin-auth-error" role="alert">{errorMessage}</p>}

     <form onSubmit={handleSubmit}>
  <div className="admin-auth-tabs">
    <button
      type="button"
      className={mode === "signin" ? "active" : ""}
      onClick={() => setMode("signin")}
    >
      Sign In
    </button>

    <button
      type="button"
      className={mode === "signup" ? "active" : ""}
      onClick={() => setMode("signup")}
    >
      Sign Up
    </button>
  </div>

  {mode === "signup" && (
    <>
      <label>Name</label>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
    </>
  )}

  <label>Email</label>
  <input
    type="email"
    placeholder="admin@fusionstaffingsolutions.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />

  <label>Password</label>
  <input
    type="password"
    placeholder="Enter password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />

  {mode === "signup" && (
    <>
      <label>Confirm Password</label>
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
    </>
  )}

  <button type="submit" className="admin-login-button">
    {mode === "signin"
      ? "Sign In to Dashboard →"
      : "Create Recruiter Account →"}
  </button>
</form>

        <div className="admin-security-note">
          🔒 Authorised personnel only
        </div>
      </div>
    </div>
  );
}