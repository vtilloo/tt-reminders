import { Link } from 'react-router-dom';

function ClassCard({ classItem, onCancel, onDelete }) {
  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatRecurring = (day, time) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `Every ${days[day]} at ${time}`;
  };

  const getDaysUntil = (dateTime) => {
    if (!dateTime) return null;
    const now = new Date();
    const classDate = new Date(dateTime);
    const diff = Math.ceil((classDate - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getNextOccurrence = (day, time) => {
    const now = new Date();
    const daysUntil = (day - now.getDay() + 7) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntil);
    return daysUntil;
  };

  const daysUntil = classItem.is_recurring
    ? getNextOccurrence(classItem.recurring_day, classItem.recurring_time)
    : getDaysUntil(classItem.date_time);

  const showWarning = daysUntil !== null && daysUntil <= 7 && daysUntil > 0 && !classItem.is_cancelled;

  return (
    <div className={`card class-card ${classItem.is_cancelled ? 'cancelled' : ''}`}>
      <div className="class-info">
        <h3>{classItem.title}</h3>
        <p>
          {classItem.is_recurring
            ? formatRecurring(classItem.recurring_day, classItem.recurring_time)
            : formatDateTime(classItem.date_time)}
        </p>
        <div className="class-meta">
          <span className={`class-badge badge-${classItem.class_type === 'one-on-one' ? 'one-on-one' : 'group'}`}>
            {classItem.class_type === 'one-on-one' ? '1-on-1' : 'Group'}
          </span>
          {classItem.is_recurring && (
            <span className="class-badge badge-recurring">Recurring</span>
          )}
          {classItem.is_cancelled && (
            <span className="class-badge badge-cancelled">Cancelled</span>
          )}
          {classItem.instructor && (
            <span style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>
              with {classItem.instructor}
            </span>
          )}
        </div>
        {showWarning && (
          <div className="alert alert-warning" style={{ marginTop: '0.5rem', padding: '0.5rem' }}>
            {daysUntil === 7
              ? 'Today is the last day to cancel!'
              : `${daysUntil} days until class - cancel deadline approaching!`}
          </div>
        )}
        {classItem.notes && (
          <p style={{ marginTop: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
            {classItem.notes}
          </p>
        )}
      </div>
      <div className="class-actions">
        <Link to={`/edit-class/${classItem.id}`} className="btn btn-outline btn-small">
          Edit
        </Link>
        <button
          onClick={() => onCancel(classItem.id, !classItem.is_cancelled)}
          className={`btn btn-small ${classItem.is_cancelled ? 'btn-secondary' : 'btn-primary'}`}
        >
          {classItem.is_cancelled ? 'Restore' : 'Cancel'}
        </button>
        <button
          onClick={() => onDelete(classItem.id)}
          className="btn btn-danger btn-small"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default ClassCard;
