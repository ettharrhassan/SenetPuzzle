import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import useLanguage from "../../hooks/useLanguage";
import Button from "./Button";

export default function Modal({ open, onClose, title, children }) {
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className="modal"
        dir={language === "ar" ? "rtl" : "ltr"}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal__heading">
          <h2 id="modal-title">{title}</h2>
          <Button
            aria-label={t("closeDialog")}
            className="icon-button"
            onClick={onClose}
            variant="quiet"
          >
            <FiX aria-hidden="true" />
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
