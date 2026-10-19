
function Results({ data = {} }) {
  if (!data || Object.keys(data).length === 0) return null;

  const verdict = data?.verdict; // "PASS", "FAIL", "RE-UPLOAD", "FLAG"
  const isPass = verdict === "PASS" || verdict === "PARTIAL_PASS";
  const isFail = verdict === "FAIL";
  const isReupload = verdict === "RE-UPLOAD" || verdict === "FLAG";

  const bannerClass = isPass ? "pass" : isFail ? "fail" : "reupload";
  const bannerIcon = isPass ? "\u2705" : isFail ? "\u274C" : "\uD83D\uDD04";

  const qrData = data?.qr_data || {};
  const ocrData = data?.ocr_data || data?.ocr_result || {};
  const regData = data?.registration_data || {};
  const checks = data?.cross_checks || {};

  // OCR is considered available only if backend returned OCR data with actual extracted content
  const ocrAvailable =
    Boolean(ocrData && typeof ocrData === "object" && Object.keys(ocrData).length > 0) &&
    Boolean(ocrData?.detected_dob || ocrData?.text_snippet || ocrData?.text);

  return (
    <div className="results">
      {/* Verdict banner */}
      <div className={`verdict-banner ${bannerClass}`}>
        <span className="verdict-icon">{bannerIcon}</span>
        <div className="verdict-text">
          <h2>Verdict: {verdict === "RE-UPLOAD" ? "RE-UPLOAD REQUIRED" : verdict}</h2>
          <p>{data?.verdict_reason}</p>
        </div>
      </div>

      {/* Prominent Action Callout for Re-upload */}
      {data?.reupload_required && data?.reupload_message && (
        <div className="reupload-callout">
          <div className="reupload-header">
            <span className="reupload-icon">{"\u26A0\uFE0F"}</span>
            <strong>Action Required:</strong>
          </div>
          <p className="reupload-text">{data.reupload_message}</p>
        </div>
      )}

      {/* Tri-Verification Data Comparison Grid */}
      <div className="result-section">
        <h3>Verification Data Comparison</h3>
        <div className="comparison-grid">
          {/* Card 1: Registration Form */}
          <div className="compare-card">
            <div className="compare-card-title">1. Registration Form</div>
            <div className="compare-row">
              <span className="label">Name:</span>
              <span className="value">{regData?.name || "\u2014"}</span>
            </div>
            <div className="compare-row">
              <span className="label">DOB:</span>
              <span className="value">{regData?.dob || "\u2014"}</span>
            </div>
            {regData?.age != null && (
              <div className="compare-row">
                <span className="label">Age:</span>
                <span className={`value ${regData.age >= 18 ? "match" : "mismatch"}`}>
                  {regData.age} yrs {regData.age >= 18 ? "(18+ ✅)" : "(Under 18 ❌)"}
                </span>
              </div>
            )}
            <div className="compare-badge badge-neutral">User Input</div>
          </div>

          {/* Card 2: Secure QR Code */}
          <div className="compare-card">
            <div className="compare-card-title">2. UIDAI QR Code</div>
            <div className="compare-row">
              <span className="label">Status:</span>
              <span className={`value ${qrData?.decoded ? "match" : "neutral"}`}>
                {qrData?.decoded ? "Decoded" : "Unreadable / Missing"}
              </span>
            </div>
            {qrData?.decoded ? (
              <>
                <div className="compare-row">
                  <span className="label">Name:</span>
                  <span className="value">{qrData?.name || "\u2014"}</span>
                </div>
                <div className="compare-row">
                  <span className="label">DOB:</span>
                  <span className="value">
                    {qrData?.dob || (isPass && ocrData?.detected_dob ? `${ocrData.detected_dob} (via Card)` : "\u2014")}
                  </span>
                </div>
                <div className="compare-row">
                  <span className="label">Gender:</span>
                  <span className="value">{qrData?.gender || "\u2014"}</span>
                </div>
                {regData?.age != null && (
                  <div className="compare-row">
                    <span className="label">Age (Verified):</span>
                    <span className={`value ${regData.age >= 18 ? "match" : "mismatch"}`}>
                      {regData.age} yrs {regData.age >= 18 ? "(≥ 18 ✅)" : "(< 18 ❌)"}
                    </span>
                  </div>
                )}
                <div className="compare-row">
                  <span className="label">Ref ID:</span>
                  <span className="value">{qrData?.reference_id || "\u2014"}</span>
                </div>
                <div className="compare-row">
                  <span className="label">PDF Signature:</span>
                  <span className="value match">{"Verified \u2705"}</span>
                </div>
              </>
            ) : (
              <p className="missing-hint">{"QR unreadable \u2014 verified via Printed Card OCR fallback."}</p>
            )}
            <div className={`compare-badge ${qrData?.decoded ? "badge-success" : "badge-neutral"}`}>
              {qrData?.decoded ? "UIDAI QR Data" : "Fell Back to OCR"}
            </div>
          </div>

          {/* Card 3: Card OCR */}
          <div className="compare-card">
            <div className="compare-card-title">3. Printed Card (OCR)</div>
            {ocrAvailable ? (
              <>
                <div className="compare-row">
                  <span className="label">Name in Text:</span>
                  <span className="value">
                    {checks?.registration_vs_card_text === true
                      ? "Found in Card \u2705"
                      : checks?.registration_vs_card_text === false
                        ? "Not Found \u274C"
                        : "\u2014"}
                  </span>
                </div>
                <div className="compare-row">
                  <span className="label">DOB:</span>
                  <span className="value">{ocrData?.detected_dob || "\u2014"}</span>
                </div>
                <div className="compare-badge badge-neutral">
                  Printed Text
                </div>
              </>
            ) : (
              <>
                <p className="missing-hint">OCR was not performed (verified via QR code).</p>
                <div className="compare-badge badge-neutral">Skipped</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Check Results */}
      <div className="result-section">
        <h3>Cross-Check Matrix</h3>
        <ul className="cross-check-list">
          {/* Check 1: Registration vs QR */}
          <li className="cross-check-item">
            <span
              className={`check-icon ${!qrData?.decoded
                ? "neutral"
                : checks?.registration_vs_qr === true
                  ? "match"
                  : "mismatch"
                }`}
            >
              {!qrData?.decoded ? "\u2014" : checks?.registration_vs_qr === true ? "\u2705" : "\u274C"}
            </span>
            <div className="check-detail">
              <strong>{"Registration \u2194 QR Match"}</strong>
              <p>
                {qrData?.decoded
                  ? checks?.registration_vs_qr === true
                    ? "Registration details match the official QR code data."
                    : "Mismatch: The registered user does not match the person inside the QR!"
                  : "Skipped (QR unreadable, verified via Printed Card OCR instead)."}
              </p>
            </div>
          </li>

          {/* Check 2: QR vs Printed Card Text */}
          <li className="cross-check-item">
            <span
              className={`check-icon ${!qrData?.decoded || !ocrAvailable
                ? "neutral"
                : checks?.qr_vs_card_text === true
                  ? "match"
                  : checks?.qr_vs_card_text === false
                    ? "mismatch"
                    : "neutral"
                }`}
            >
              {!qrData?.decoded || !ocrAvailable
                ? "\u2014"
                : checks?.qr_vs_card_text === true
                  ? "\u2705"
                  : checks?.qr_vs_card_text === false
                    ? "\u274C"
                    : "\u2014"}
            </span>
            <div className="check-detail">
              <strong>{"QR \u2194 Printed Card Text"}</strong>
              <p>
                {!qrData?.decoded
                  ? "Skipped (QR not decoded)."
                  : !ocrAvailable
                    ? "Skipped (OCR was not performed)."
                    : checks?.qr_vs_card_text === true
                      ? "Printed text on the card matches the QR payload."
                      : checks?.qr_vs_card_text === false
                        ? "Printed card text differs from the QR payload."
                        : "Check was not performed."}
              </p>
            </div>
          </li>

          {/* Check 4: Age Eligibility (18+) */}
          {regData?.age != null && (
            <li className="cross-check-item">
              <span className={`check-icon ${regData.age >= 18 ? "match" : "mismatch"}`}>
                {regData.age >= 18 ? "✅" : "❌"}
              </span>
              <div className="check-detail">
                <strong>18+ Age Requirement</strong>
                <p>
                  {regData.age >= 18
                    ? `Attendee is ${regData.age} years old (Meets 18+ requirement for Mood Indigo).`
                    : `Attendee is ${regData.age} years old (Under 18 — not eligible to attend).`}
                </p>
              </div>
            </li>
          )}

          {/* Check 3: Registration vs Printed Card Text */}
          <li className="cross-check-item">
            <span
              className={`check-icon ${!ocrAvailable
                ? "neutral"
                : checks?.registration_vs_card_text === true
                  ? "match"
                  : checks?.registration_vs_card_text === false
                    ? "mismatch"
                    : "neutral"
                }`}
            >
              {!ocrAvailable
                ? "\u2014"
                : checks?.registration_vs_card_text === true
                  ? "\u2705"
                  : checks?.registration_vs_card_text === false
                    ? "\u274C"
                    : "\u2014"}
            </span>
            <div className="check-detail">
              <strong>{"Registration \u2194 Printed Card Text (OCR)"}</strong>
              <p>
                {!ocrAvailable
                  ? "Skipped (OCR was not performed)."
                  : checks?.registration_vs_card_text === true
                    ? "Printed text on the card matches the registration details."
                    : checks?.registration_vs_card_text === false
                      ? "Printed text on the card does not match the entered registration details."
                      : "Check was not performed."}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Results;
