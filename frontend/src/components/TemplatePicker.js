export default function TemplatePicker({ templates, onSelect }) {
  return (
    <div className="template-picker">
      {templates.map((t) => (
        <button key={t.id} className="template-btn" onClick={() => onSelect(t)}>
          {t.name} Template
        </button>
      ))}
    </div>
  );
}
