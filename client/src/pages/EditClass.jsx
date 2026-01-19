import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import ClassForm from '../components/ClassForm';

function EditClass() {
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const res = await api.get(`/classes/${id}`);
        setClassData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [id]);

  const handleSubmit = async (data) => {
    setError('');
    setSaving(true);

    try {
      await api.put(`/classes/${id}`, data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!classData && !loading) {
    return (
      <div>
        <div className="alert alert-error">Class not found</div>
        <Link to="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-light)' }}>
          &larr; Back to Dashboard
        </Link>
      </div>

      <h1 style={{ marginBottom: '1.5rem' }}>Edit Class</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <ClassForm
          initialData={classData}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </div>
    </div>
  );
}

export default EditClass;
