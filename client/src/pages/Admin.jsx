import { useState, useEffect } from 'react';
import api from '../services/api';

function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, classesRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/classes')
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setClasses(classesRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTriggerReminders = async () => {
    try {
      await api.post('/trigger-reminders');
      alert('Reminder check triggered! Check server logs for details.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalClasses}</div>
            <div className="stat-label">Total Classes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pushSubscribers}</div>
            <div className="stat-label">Push Subscribers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.notificationsSent}</div>
            <div className="stat-label">Notifications Sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.recurringClasses}</div>
            <div className="stat-label">Recurring Classes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.cancelledClasses}</div>
            <div className="stat-label">Cancelled Classes</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleTriggerReminders}
          className="btn btn-secondary"
        >
          Trigger Reminder Check
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('stats')}
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-outline'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-outline'}`}
        >
          Classes ({classes.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Classes</th>
                <th>Push</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.class_count}</td>
                  <td>{user.has_push ? 'Yes' : 'No'}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'classes' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Student</th>
                <th>Type</th>
                <th>Schedule</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id}>
                  <td>{cls.title}</td>
                  <td>{cls.user_name}</td>
                  <td>{cls.class_type}</td>
                  <td>
                    {cls.is_recurring
                      ? `Every ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][cls.recurring_day]} at ${cls.recurring_time}`
                      : new Date(cls.date_time).toLocaleDateString()}
                  </td>
                  <td>{cls.is_cancelled ? 'Cancelled' : 'Active'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="card">
          <h3>System Information</h3>
          <p style={{ marginTop: '1rem' }}>
            The scheduler runs daily at 9 AM and sends push notifications to users
            who have classes scheduled 7 days from now.
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Use the "Trigger Reminder Check" button to manually run the scheduler
            for testing purposes.
          </p>
        </div>
      )}
    </div>
  );
}

export default Admin;
