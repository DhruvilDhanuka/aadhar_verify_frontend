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

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    setIsEmailSubmitted(true);
    setError(null);
    try {
      const res = await fetch(API_EMAIL_CHECK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `Server returned ${res.status}`);
      } else {
        const data = await res.json();
        setEmailCallResult(data);
      }
    } catch (err) {
      setIsEmailSubmitted(false);
      setError(err.message || "Failed to check email availability");
    }
  };

  return (
    <div className="app">

      <input
        type="text"
        placeholder="email"
        value={email}
        disabled={isEmailSubmitted}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleEmailSubmit} disabled={isEmailSubmitted}>
        check for Email availabilty
      </button>

      {error && <div className="error-msg">{error}</div>}


      {emailCallResult && (emailCallResult.exists ? (
        <div>
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

      ) : (<div>You are not eligible to attend the concert</div>))}

    </div>
  );
}

export default App;
