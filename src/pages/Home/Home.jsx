import { useState } from "react";
import { FiArrowUpRight, FiGrid } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import useLanguage from "../../hooks/useLanguage";
import usePlayer from "../../hooks/usePlayer";

export default function Home() {
  const { t } = useLanguage();
  const { player, result, registerPlayer } = usePlayer();
  const navigate = useNavigate();
  const [name, setName] = useState(player?.name ?? "");
  const [cycleNumber, setCycleNumber] = useState(player?.cycleNumber?.toString() ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    const cycle = Number(cycleNumber);

    if (!trimmedName || !Number.isInteger(cycle) || cycle < 1) {
      setError(t("registrationValidation"));
      return;
    }

    setSaving(true);
    try {
      await registerPlayer({ name: trimmedName, cycleNumber: cycle });
      navigate(result ? "/results" : "/challenges");
    } catch (registrationError) {
      setError(registrationError.message || t("registrationSaveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="registration-page">
      <section className="registration-intro">
        <span className="eyebrow"><FiGrid aria-hidden="true" />{t("welcomeEyebrow")}</span>
        <h1>{t("welcomeTitle")}</h1>
        <p>{t("registrationDescription")}</p>
        <div aria-hidden="true" className="registration-art">
          <div className="registration-art__tile">✦</div>
          <div className="registration-art__tile">◆</div>
          <div className="registration-art__tile">●</div>
        </div>
      </section>

      <Card className="registration-card">
        <div className="registration-card__heading">
          <span className="section-kicker">{t("playerDetails")}</span>
          <h2>{t("joinSenet")}</h2>
          <p>{t("playerDetailsDescription")}</p>
        </div>
        <form className="registration-form" noValidate onSubmit={handleSubmit}>
          <Input
            autoComplete="name"
            id="player-name"
            label={t("playerName")}
            maxLength={50}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder={t("playerNamePlaceholder")}
            required
            value={name}
          />
          <Input
            id="cycle-number"
            label={t("cycleNumber")}
            max="999"
            min="1"
            onChange={(event) => {
              setCycleNumber(event.target.value);
              setError("");
            }}
            placeholder={t("cycleNumberPlaceholder")}
            required
            type="number"
            value={cycleNumber}
          />
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <Button className="registration-submit" loading={saving} type="submit">
            {t("startChallenge")}<FiArrowUpRight aria-hidden="true" />
          </Button>
        </form>
        <p className="registration-card__note">{t("playerDataNote")}</p>
      </Card>
    </div>
  );
}
