export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
