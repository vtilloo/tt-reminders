import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function RespondToReminder() {
  const { notificationId } = useParams();
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const fetchReminder = async () => {
      try {
        const res = await api.get(`/reminders/${notificationId}`);
        setReminder(res.data);
        if (res.data.already_responded) {
          setSubmitted(true);
          setResponse(res.data.previous_response);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReminder();
  }, [notificationId]);

  const handleResponse = async (responseValue) => {
    setSubmitting(true);
    try {
      await api.post(`/reminders/${notificationId}/respond`, { response: responseValue });
      setSubmitted(true);
      setResponse(responseValue);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="respond-page">
        <div className="alert alert-error">{error}</div>
        <Link to="/dashboard" className="btn btn-outline" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!reminder) {
    return (
      <div className="respond-page">
        <div className="alert alert-error">Reminder not found</div>
        <Link to="/dashboard" className="btn btn-outline" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="respond-page">
      <h1>Class Reminder</h1>

      <div className="reminder-card">
        <h2>{reminder.title}</h2>
        <div className="reminder-details">
          <p><strong>Type:</strong> {reminder.class_type === 'one-on-one' ? 'One-on-One' : 'Group'}</p>
          {reminder.instructor && <p><strong>Instructor:</strong> {reminder.instructor}</p>}
          <p><strong>Date:</strong> {formatDate(reminder.target_date)}</p>
          {reminder.recurring_time && <p><strong>Time:</strong> {formatTime(reminder.recurring_time)}</p>}
          {reminder.is_recurring ? (
            <p className="recurring-badge">Recurring Class</p>
          ) : null}
        </div>
      </div>

      {submitted ? (
        <div className="response-confirmation">
          <div className={`response-result ${response === 'yes' ? 'response-yes' : 'response-no'}`}>
            {response === 'yes' ? (
              <>
                <span className="response-icon">&#10003;</span>
                <p>Great! You confirmed you'll attend this class.</p>
              </>
            ) : (
              <>
                <span className="response-icon">&#10005;</span>
                <p>You indicated you'll skip this class. The club has been notified.</p>
              </>
            )}
          </div>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="response-buttons">
          <p className="response-prompt">Will you attend this class?</p>
          <div className="button-group">
            <button
              className="btn btn-success btn-large"
              onClick={() => handleResponse('yes')}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : "Yes, I'll attend"}
            </button>
            <button
              className="btn btn-danger btn-large"
              onClick={() => handleResponse('no')}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : "No, I'm skipping"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RespondToReminder;
