import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ClassForm from '../components/ClassForm';

function AddClass() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      await api.post('/classes', data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-light)' }}>
          &larr; Back to Dashboard
        </Link>
      </div>

      <h1 style={{ marginBottom: '1.5rem' }}>Add New Class</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <ClassForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}

export default AddClass;
