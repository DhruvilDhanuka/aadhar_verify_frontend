import { useState } from "react";
import "./App.css";
import VerifyForm from "./components/VerifyForm";
import Results from "./components/Results";



const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV
  ? "http://localhost:8000"
  : "https://aadhar-verify-backend.onrender.com")


const API_VERIFY_URL = `${BACKEND_URL}/api/verify`;
const API_EMAIL_CHECK_URL = `${BACKEND_URL}/emails/check`;

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [emailCallResult, setEmailCallResult] = useState(null);

  const handleVerify = async ({ name, dob, file }) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("aadhaar_image", file);
    formData.append("expected_name", name);
    formData.append("expected_dob", dob);

    try {
      const res = await fetch(API_VERIFY_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);

  const handleEmailSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;
    setIsEmailSubmitted(true);
    setError(null);
    try {
      const res = await fetch(API_EMAIL_CHECK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `Server returned ${res.status}`);
      } else {
        const data = await res.json();
        setEmailCallResult(data);
      }
    } catch (err) {
      setError(err.message || "Failed to check email availability");
    } finally {
      setIsEmailSubmitted(false);
    }
  };

  const handleResetEmail = () => {
    setEmailCallResult(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className={`app-container ${emailCallResult?.exists ? "bg-verified" : "bg-concert"}`}>
      <div className="app">
        {!emailCallResult?.exists ? (
          <div className="email-screen-container">
            <div className="email-card">
              <div className="email-card-icon">🎟️</div>
              <h1 className="email-card-title">Concert Entry Verification</h1>
              <p className="email-card-subtitle">
                Enter your registered email address to check ticket availability and verify your identity.
              </p>

              <form onSubmit={handleEmailSubmit} className="email-form">
                <div className="email-input-group">
                  <input
                    type="email"
                    className="email-input"
                    placeholder="Enter your registered email"
                    value={email}
                    disabled={isEmailSubmitted}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                  <button
                    type="submit"
                    className="email-submit-btn"
                    disabled={isEmailSubmitted || !email.trim()}
                  >
                    {isEmailSubmitted ? "Checking..." : "Check Availability"}
                  </button>
                </div>
              </form>

              {error && <div className="error-msg">{error}</div>}

              {emailCallResult && !emailCallResult.exists && (
                <div className="not-eligible-card">
                  <div className="not-eligible-icon">⚠️</div>
                  <div className="not-eligible-text">
                    <strong>Not Eligible for Entry</strong>
                    <p>No confirmed ticket found for <em>{email}</em>. You are not eligible to attend the concert.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="verification-screen">
            <div className="verified-email-bar">
              <div className="verified-email-info">
                <span className="verified-badge-icon">✓</span>
                <span>Ticket verified for: <strong>{email}</strong></span>
              </div>
              <button type="button" className="change-email-btn" onClick={handleResetEmail}>
                Change
              </button>
            </div>

            <h1>Aadhaar Verification</h1>
            <p className="app-subtitle">
              Upload an official Aadhaar PDF from genuine sources and verify it
              against registration details
            </p>
            <div className="privacy-banner">
              🔒 <strong>Zero-Retention Verification:</strong> Uploaded Aadhaar PDFs
              are verified in-memory and immediately destroyed. Only cryptographically
              genuine PDFs signed by UIDAI are processed.
            </div>

            <VerifyForm onSubmit={handleVerify} loading={loading} email={email} />

            {result && <Results data={result} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
