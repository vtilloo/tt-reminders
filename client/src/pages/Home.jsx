import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();

  return (
    <div className="hero">
      <h1>Never Forget to Cancel</h1>
      <p>
        Get reminded 7 days before your table tennis classes so you can cancel without penalty.
      </p>

      {user ? (
        <Link to="/dashboard" className="btn btn-primary">
          Go to Dashboard
        </Link>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/signup" className="btn btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-outline">
            Login
          </Link>
        </div>
      )}

      <div className="features">
        <div className="feature">
          <div className="feature-icon">📅</div>
          <h3>Track Your Classes</h3>
          <p>Add one-time or recurring weekly classes to your schedule.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🔔</div>
          <h3>Get Notified</h3>
          <p>Receive push notifications 7 days before each class.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">💰</div>
          <h3>Avoid Penalties</h3>
          <p>Cancel on time and save money on late cancellation fees.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
