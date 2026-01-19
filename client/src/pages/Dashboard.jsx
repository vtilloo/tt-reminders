import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ClassCard from '../components/ClassCard';

function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCancel = async (id, isCancelled) => {
    try {
      await api.patch(`/classes/${id}/cancel`, { is_cancelled: isCancelled });
      setClasses(classes.map(c =>
        c.id === id ? { ...c, is_cancelled: isCancelled ? 1 : 0 } : c
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      await api.delete(`/classes/${id}`);
      setClasses(classes.filter(c => c.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const activeClasses = classes.filter(c => !c.is_cancelled);
  const cancelledClasses = classes.filter(c => c.is_cancelled);

  return (
    <div>
      <div className="dashboard-header">
        <h1>My Classes</h1>
        <Link to="/add-class" className="btn btn-primary">
          Add Class
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {classes.length === 0 ? (
        <div className="empty-state">
          <p>You haven't added any classes yet.</p>
          <Link to="/add-class" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Add Your First Class
          </Link>
        </div>
      ) : (
        <>
          {activeClasses.length > 0 && (
            <div className="class-list">
              <h2 style={{ marginBottom: '1rem' }}>Active Classes ({activeClasses.length})</h2>
              {activeClasses.map(classItem => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {cancelledClasses.length > 0 && (
            <div className="class-list" style={{ marginTop: '2rem' }}>
              <h2 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
                Cancelled Classes ({cancelledClasses.length})
              </h2>
              {cancelledClasses.map(classItem => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
