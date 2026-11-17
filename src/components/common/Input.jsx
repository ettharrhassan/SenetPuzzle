export default function Input({ label, id, className = "", ...props }) {
  return (
    <label className={`field ${className}`.trim()} htmlFor={id}>
      {label ? <span className="field__label">{label}</span> : null}
      <input className="field__input" id={id} {...props} />
    </label>
  );
}
