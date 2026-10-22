function Results({ data = {} }) {
  if (!data || Object.keys(data).length === 0) return null;

  const verdict = data?.verdict; // "PASS", "FAIL", "RE-UPLOAD", "FLAG"
  const isPass = verdict === "PASS" || verdict === "PARTIAL_PASS";
  const isFail = verdict === "FAIL";

  const bannerClass = isPass ? "pass" : isFail ? "fail" : "reupload";
  const bannerIcon = isPass ? "✅" : isFail ? "❌" : "⚠️";

  const qrData = data?.qr_data || {};
  const ocrData = data?.ocr_data || {};
  const regData = data?.registration_data || {};

  // Extracted details directly from Aadhaar card
  const extractedName =
    qrData?.name || (isPass ? regData?.name : null);
  const extractedDob =
    qrData?.dob || ocrData?.detected_dob || (isPass ? regData?.dob : null);

  // 18+ adult status and age from backend (with safe fallback if calling remote backend)
  const isAdultBackend = data?.is_adult ?? regData?.is_adult;
  const ageBackend = data?.age ?? regData?.age;

  const fallbackAge = (() => {
    const dob = extractedDob || regData?.dob;
    if (!dob) return null;
    const match = String(dob).match(/\b(19\d{2}|20\d{2})\b/);
    return match ? new Date().getFullYear() - parseInt(match[1], 10) : null;
  })();

  const age = ageBackend != null ? ageBackend : fallbackAge;
  const isAdult = isAdultBackend != null ? isAdultBackend : (age != null ? age >= 18 : null);

  return (
    <div className="results minimal-results">
      {/* 1. Overall Verdict Status Banner */}
      <div className={`verdict-banner ${bannerClass}`}>
        <span className="verdict-icon">{bannerIcon}</span>
        <div className="verdict-text">
          <h2>
            {isPass
              ? "Verification Successful (Eligible)"
              : isFail
              ? "Verification Failed (Not Eligible)"
              : "Re-upload Required"}
          </h2>
          <p>{data?.verdict_reason}</p>
        </div>
      </div>

      {/* 2. Specific Issue Callout if verification failed */}
      {!isPass && data?.reupload_message && (
        <div className="reupload-callout">
          <div className="reupload-header">
            <span className="reupload-icon">⚠️</span>
            <strong>Issue Detected:</strong>
          </div>
          <p className="reupload-text">{data.reupload_message}</p>
        </div>
      )}

      {/* 3. Extracted Details from Aadhaar Card */}
      <div className="result-section">
        <h3>Extracted Aadhaar Details</h3>
        <div className="extracted-details-card">
          <div className="detail-row">
            <span className="detail-label">Extracted Name:</span>
            <span className="detail-value">
              {extractedName || (
                <span className="text-muted">Could not extract / Tampered</span>
              )}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Extracted Date of Birth:</span>
            <span className="detail-value">
              {extractedDob || (
                <span className="text-muted">Could not extract</span>
              )}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Age Requirement (18+):</span>
            <span className="detail-value">
              {isAdult !== null ? (
                <span className={`age-badge ${isAdult ? "eligible" : "ineligible"}`}>
                  {isAdult
                    ? `18+ Eligible (${age} yrs) ✅`
                    : `Under 18 (${age} yrs) ❌`}
                </span>
              ) : (
                <span className="text-muted">Age not determined</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results;
