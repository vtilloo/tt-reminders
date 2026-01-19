import { useState, useEffect } from 'react';

function ClassForm({ initialData, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    class_type: 'one-on-one',
    instructor: '',
    notes: '',
    is_recurring: false,
    date_time: '',
    recurring_day: 1,
    recurring_time: '18:00',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        class_type: initialData.class_type || 'one-on-one',
        instructor: initialData.instructor || '',
        notes: initialData.notes || '',
        is_recurring: initialData.is_recurring === 1,
        date_time: initialData.date_time
          ? new Date(initialData.date_time).toISOString().slice(0, 16)
          : '',
        recurring_day: initialData.recurring_day ?? 1,
        recurring_time: initialData.recurring_time || '18:00',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      title: formData.title,
      class_type: formData.class_type,
      instructor: formData.instructor || null,
      notes: formData.notes || null,
      is_recurring: formData.is_recurring,
    };

    if (formData.is_recurring) {
      data.recurring_day = parseInt(formData.recurring_day);
      data.recurring_time = formData.recurring_time;
    } else {
      data.date_time = new Date(formData.date_time).toISOString();
    }

    onSubmit(data);
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="title">Class Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          className="form-input"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Forehand Training"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="class_type">Class Type *</label>
        <select
          id="class_type"
          name="class_type"
          className="form-select"
          value={formData.class_type}
          onChange={handleChange}
        >
          <option value="one-on-one">One-on-One</option>
          <option value="group">Group</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="instructor">Instructor</label>
        <input
          type="text"
          id="instructor"
          name="instructor"
          className="form-input"
          value={formData.instructor}
          onChange={handleChange}
          placeholder="e.g., Coach John"
        />
      </div>

      <div className="form-group">
        <label className="form-checkbox">
          <input
            type="checkbox"
            name="is_recurring"
            checked={formData.is_recurring}
            onChange={handleChange}
          />
          <span>This is a recurring weekly class</span>
        </label>
      </div>

      {formData.is_recurring ? (
        <>
          <div className="form-group">
            <label className="form-label" htmlFor="recurring_day">Day of Week *</label>
            <select
              id="recurring_day"
              name="recurring_day"
              className="form-select"
              value={formData.recurring_day}
              onChange={handleChange}
            >
              {days.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="recurring_time">Time *</label>
            <input
              type="time"
              id="recurring_time"
              name="recurring_time"
              className="form-input"
              value={formData.recurring_time}
              onChange={handleChange}
              required
            />
          </div>
        </>
      ) : (
        <div className="form-group">
          <label className="form-label" htmlFor="date_time">Date and Time *</label>
          <input
            type="datetime-local"
            id="date_time"
            name="date_time"
            className="form-input"
            value={formData.date_time}
            onChange={handleChange}
            required
          />
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          className="form-textarea"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional notes..."
        />
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? 'Saving...' : 'Save Class'}
      </button>
    </form>
  );
}

export default ClassForm;
