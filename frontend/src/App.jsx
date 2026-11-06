import { useState } from "react";
import "./App.css";
import VerifyForm from "./components/VerifyForm";
import Results from "./components/Results";



const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV
  ? "http://localhost:8000"
  : "https://aadhar-verify-backend.onrender.com")


const API_VERIFY_URL = `${BACKEND_URL}/api/verify`;
const API_EMAIL_CHECK_URL = `${BACKEND_URL}/emails/check`;

// ============================================================================
// TESTING TOGGLE:
// Set SKIP_EMAIL_CHECK to true to skip the email check screen and directly enter Name & DOB.
// Set SKIP_EMAIL_CHECK to false when ready to restore the original email check flow.
// ============================================================================
const SKIP_EMAIL_CHECK = true;

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
    <div className={`app-container ${SKIP_EMAIL_CHECK || emailCallResult?.exists ? "bg-verified" : "bg-concert-theme"}`}>
      <header className="concert-top-bar">
        <div className="top-brand">CONCERT VERIFICATION 2026</div>
      </header>

      <div className="app">
        {/*
          EMAIL CHECK SCREEN:
          Skipped for testing when SKIP_EMAIL_CHECK = true.
          Toggle SKIP_EMAIL_CHECK to false at the top of this file to restore the full email verification step.
        */}
        {!SKIP_EMAIL_CHECK && !emailCallResult?.exists ? (
          <div className="portal-screen-container">
            <div className="portal-hero">
              <div className="portal-pill-badge">CONCERT ENTRY</div>
              <h1 className="portal-hero-title">
                <span className="title-line">CONCERT</span>
                <span className="title-line">VERIFICATION</span>
              </h1>
              <p className="portal-hero-subtitle">
                Enter your registered email address to check ticket availability and verify your identity.
              </p>

              <form onSubmit={handleEmailSubmit} className="portal-form">
                <div className="portal-input-box">
                  <input
                    type="email"
                    className="portal-input"
                    placeholder="Enter your registered email"
                    value={email}
                    disabled={isEmailSubmitted}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                  <button
                    type="submit"
                    className="portal-red-action-btn"
                    disabled={isEmailSubmitted || !email.trim()}
                  >
                    {isEmailSubmitted ? "Checking..." : "Register / Verify"}
                  </button>
                </div>
              </form>

              {error && <div className="portal-error-msg">{error}</div>}

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

            <div className="portal-stage-footer">
              <img
                src="/concert-stage.png"
                alt="Concert Stage"
                className="portal-stage-img"
                onError={(e) => {
                  // Fallback to concert-bg.jpg if png fails
                  e.target.src = "/concert-bg.jpg";
                }}
              />
            </div>
          </div>
        ) : (
          <div className="verification-screen">
            {/* Ticket verified bar - only displayed when email check is enabled */}
            {!SKIP_EMAIL_CHECK && (
              <div className="verified-email-bar">
                <div className="verified-email-info">
                  <span className="verified-badge-icon">✓</span>
                  <span>Ticket verified for: <strong>{email}</strong></span>
                </div>
                <button type="button" className="change-email-btn" onClick={handleResetEmail}>
                  Change
                </button>
              </div>
            )}

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

            {error && (
              <div className="error-msg" role="alert">
                <strong>Error: </strong>{error}
              </div>
            )}

            <VerifyForm onSubmit={handleVerify} loading={loading} email={email} isTesting={SKIP_EMAIL_CHECK} />

            {result && <Results data={result} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
