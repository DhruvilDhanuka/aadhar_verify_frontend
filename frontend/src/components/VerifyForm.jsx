import { useState, useRef, useEffect } from "react";
import { fetchUserDetailsByEmail } from "../api";

function VerifyForm({ onSubmit, loading, email, isTesting = true, passwordRequired = false, onResetPasswordPrompt }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Focus password input when prompt becomes active
  useEffect(() => {
    if (passwordRequired && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [passwordRequired]);

  // When testing mode is off, automatically fetch details by email (original behavior)
  useEffect(() => {
    if (!isTesting && email) {
      fetchUserDetailsByEmail(email).then((details) => {
        if (details) {
          if (details.name) setName(details.name);
          if (details.dob) setDob(details.dob);
        }
      });
    }
  }, [email, isTesting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    // Convert date from YYYY-MM-DD (input type=date) to DD-MM-YYYY
    let formattedDob = "";
    if (dob) {
      const [y, m, d] = dob.split("-");
      formattedDob = `${d}-${m}-${y}`;
    }
    onSubmit({ name: name.trim(), dob: formattedDob, file, password: password.trim() });
  };

  const isPdfFile = (f) => {
    if (!f) return false;
    return f.type === "application/pdf" || /\.pdf$/i.test(f.name);
  };

  const processSelectedFile = (f) => {
    if (!f) return;
    if (isPdfFile(f)) {
      setFile(f);
      setFileError(null);
      setPassword("");
      if (onResetPasswordPrompt) onResetPasswordPrompt();
    } else {
      setFile(null);
      setFileError("Only genuine PDF documents from UIDAI, DigiLocker, or mAadhaar are accepted. Images, scans, and screenshots cannot be verified.");
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    processSelectedFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    processSelectedFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <form className="verify-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="expected-name">Name {isTesting ? "" : "(from registration)"}</label>
          <input
            id="expected-name"
            type="text"
            placeholder={isTesting ? "Enter registered name (e.g. John Doe)" : "Fetching registered name..."}
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={!isTesting}
            required
          />
          {/*
            ORIGINAL READ-ONLY (without testing mode):
            <input
              id="expected-name"
              type="text"
              placeholder="Fetching registered name..."
              value={name}
              readOnly
            />
          */}
        </div>
        <div className="form-group">
          <label htmlFor="expected-dob">Date of Birth {isTesting ? "" : "(from registration)"}</label>
          <input
            id="expected-dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            readOnly={!isTesting}
            required
          />
          {/*
            ORIGINAL READ-ONLY (without testing mode):
            <input
              id="expected-dob"
              type="date"
              value={dob}
              readOnly
            />
          */}
        </div>
      </div>

      <div className="upload-area">
        <div className="upload-header">
          <label>Official Aadhaar Document (PDF Only)</label>
          <div className="sources-pills">
            <span className="source-pill">🏛️ myAadhaar</span>
            <span className="source-pill">📂 DigiLocker</span>
            <span className="source-pill">📱 mAadhaar</span>
          </div>
        </div>

        <div
          className={`file-drop-zone${dragOver ? " drag-over" : ""}${file ? " has-file" : ""}${fileError ? " has-error" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {file ? (
            <>
              <div className="pdf-icon-indicator">📄 PDF Ready</div>
              <p className="file-name">{file.name}</p>
              <p className="file-size">{formatFileSize(file.size)}</p>
              <p className="change-hint">Click to change file</p>
            </>
          ) : (
            <div>
              <p className="drop-main-text">
                Drag &amp; drop your official Aadhaar PDF here, or click to browse
              </p>
              <p className="source-requirement-note">
                Only genuine PDF files downloaded from <strong>myAadhaar (UIDAI)</strong>, <strong>DigiLocker</strong>, or <strong>mAadhaar</strong> are accepted.
              </p>
              <div className="pdf-validation-guidelines">
                <span className="guideline-badge">✓ UIDAI Digital Signature required</span>
                <span className="guideline-badge restriction">✕ Photos/Scans/Images rejected</span>
              </div>
              <small className="password-hint">
                🔒 Password-protected PDFs are unlocked automatically using your registration Name &amp; Birth Year (e.g., DHRU2007)
              </small>
            </div>
          )}
        </div>

        {fileError && (
          <div className="file-format-error">
            <span className="error-icon">⚠️</span>
            <span>{fileError}</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {passwordRequired && (
        <div className="bg-blue-50/90 border border-blue-200 border-l-4 border-l-blue-600 rounded-lg p-4 mb-5 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-base text-blue-900 mb-1.5">

            <label htmlFor="manual-pdf-password" className="cursor-pointer">
              Enter PDF Password
            </label>
          </div>
          <p className="text-xs sm:text-sm text-blue-800 m-0 mb-3 leading-relaxed">
            This e-Aadhaar PDF is password-protected and could not be unlocked automatically. Please enter your password below to proceed:
          </p>
          <div className="mb-2">
            <input
              id="manual-pdf-password"
              ref={passwordInputRef}
              type="text"
              className="w-full px-3.5 py-2.5 text-base tracking-wider font-semibold text-slate-900 bg-white border border-blue-300 rounded-md outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 box-border transition-all"
              placeholder="e.g. FIRST4NAME + YEAR (e.g., AMAN2002)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <small className="block text-xs text-slate-600 leading-normal">
            <strong className="font-semibold text-slate-700">UIDAI Rule:</strong> First 4 letters of your Name in CAPITAL + 4-digit Year of Birth.
          </small>
        </div>
      )}

      <button
        type="submit"
        className={`submit-btn${loading ? " loading" : ""}${passwordRequired ? " !bg-blue-600 hover:!bg-blue-700 !border-blue-700" : ""
          }`}
        disabled={!file || loading || (passwordRequired && !password.trim())}
      >
        {loading
          ? (passwordRequired ? "Unlocking & Verifying..." : "Verifying Digital Signature & Credentials...")
          : (passwordRequired ? "Unlock & Verify Aadhaar" : "Verify Aadhaar")}
      </button>
    </form>
  );
}

export default VerifyForm;
