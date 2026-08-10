import { useEffect, useState } from "react";
import { CONSENT_KEY, loadPixel } from "../pixel";

export const Consent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted") loadPixel();
    else if (v !== "declined") setVisible(true);
  }, []);

  const choose = (v: "accepted" | "declined") => {
    localStorage.setItem(CONSENT_KEY, v);
    setVisible(false);
    if (v === "accepted") loadPixel();
  };

  if (!visible) return null;
  return (
    <div className="consent" role="dialog" aria-label="הסכמת עוגיות">
      <span className="consent-text">נשתמש בעוגיות למדידה ושיווק רק אם תאשרו 🍪</span>
      <div className="consent-actions">
        <button type="button" className="consent-yes" onClick={() => choose("accepted")}>אני מאשר/ת</button>
        <button type="button" className="consent-no" onClick={() => choose("declined")}>אוותר</button>
      </div>
    </div>
  );
};
