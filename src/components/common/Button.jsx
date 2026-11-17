import { Link } from "react-router-dom";
import Loader from "./Loader";

export default function Button({
  children,
  to,
  variant = "primary",
  className = "",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  ...props
}) {
  const classes = `button button--${variant} ${className}`.trim();
  const content = (
    <>
      <span className="button__content">{children}</span>
      {loading ? (
        <Loader
          className="button__loader"
          color={variant === "primary" ? "var(--color-on-primary)" : "var(--color-primary)"}
          size="small"
          type="button"
        />
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link
        className={classes}
        to={to}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        onClick={(event) => {
          if (disabled || loading) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}
