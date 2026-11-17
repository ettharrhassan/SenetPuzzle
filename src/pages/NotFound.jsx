import useLanguage from "../hooks/useLanguage";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <Card className="empty-state">
      <span className="empty-state__mark">404</span>
      <h1>{t("notFound")}</h1>
      <Button to="/">{t("backHome")}</Button>
    </Card>
  );
}
