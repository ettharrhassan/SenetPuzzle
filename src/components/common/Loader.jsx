import { InfinitySpin } from "react-loader-spinner";
import { loaderConfig } from "../../constants/loaders";
import useLanguage from "../../hooks/useLanguage";

const loaderComponents = { InfinitySpin };

/**
 * Reusable SENET loader. Use `type="main"`, `type="challenge"`, or
 * `type="button"`; the visual settings and screen-reader labels live centrally.
 */
export default function Loader({
  type = "main",
  size,
  color,
  visible = true,
  className = "",
  fullScreen = false,
  ariaLabel,
}) {
  const { t } = useLanguage();
  if (!visible) return null;

  const config = loaderConfig[type] ?? loaderConfig.main;
  const LoaderComponent = loaderComponents[config.loader] ?? InfinitySpin;
  const label = ariaLabel ?? t(config.labelKey);
  const dimensions = size === "small"
    ? config.smallSize ?? Math.round(config.size * 0.8)
    : size ?? config.size;
  const loaderProps = {
    height: dimensions,
    width: dimensions,
    ariaLabel: label,
    visible,
    wrapperClass: "loader__spinner",
  };

  loaderProps.color = color ?? config.color;

  const Root = fullScreen ? "div" : "span";
  const classes = [
    "loader",
    `loader--${type}`,
    fullScreen ? "loader--fullscreen" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <Root aria-live="polite" className={classes}>
      <LoaderComponent {...loaderProps} />
    </Root>
  );
}
