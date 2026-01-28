import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Analytics() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reminders/analytics/skipped');
        setStats(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const chartData = {
    labels: stats.map(s => formatMonth(s.month)),
    datasets: [
      {
        label: 'Skipped Classes',
        data: stats.map(s => s.skipped_count),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Skipped Classes by Month',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const totalSkipped = stats.reduce((sum, s) => sum + s.skipped_count, 0);

  return (
    <div className="analytics-page">
      <div className="dashboard-header">
        <h1>Analytics</h1>
        <Link to="/dashboard" className="btn btn-outline">
          Back to Dashboard
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="analytics-summary">
        <div className="stat-card">
          <span className="stat-value">{totalSkipped}</span>
          <span className="stat-label">Total Skipped Classes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.length}</span>
          <span className="stat-label">Months with Skips</span>
        </div>
      </div>

      {stats.length === 0 ? (
        <div className="empty-state">
          <p>No skipped classes recorded yet.</p>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-light)' }}>
            When you respond "No" to a reminder, it will be tracked here.
          </p>
        </div>
      ) : (
        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default Analytics;
