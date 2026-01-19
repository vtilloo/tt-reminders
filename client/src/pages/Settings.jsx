import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  checkPushPermission,
  requestPushPermission,
  isPushSubscribed
} from '../services/push';

function Settings() {
  const { user } = useAuth();
  const [pushStatus, setPushStatus] = useState('loading');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const permission = await checkPushPermission();
        if (permission === 'unsupported') {
          setPushStatus('unsupported');
          return;
        }

        await registerServiceWorker();
        const isSubscribed = await isPushSubscribed();
        setSubscribed(isSubscribed);
        setPushStatus(permission);
      } catch (err) {
        console.error('Error checking push status:', err);
        setPushStatus('error');
      }
    };

    checkStatus();
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (pushStatus === 'default') {
        const permission = await requestPushPermission();
        if (permission !== 'granted') {
          setMessage('Permission denied. Please enable notifications in your browser settings.');
          setPushStatus(permission);
          return;
        }
        setPushStatus('granted');
      }

      await subscribeToPush();
      setSubscribed(true);
      setMessage('Notifications enabled successfully!');
    } catch (err) {
      console.error('Error enabling notifications:', err);
      setMessage('Failed to enable notifications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    setMessage('');

    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      setMessage('Notifications disabled.');
    } catch (err) {
      console.error('Error disabling notifications:', err);
      setMessage('Failed to disable notifications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await api.post('/push/test');
      setMessage(res.data.message || 'Test notification sent!');
    } catch (err) {
      console.error('Error sending test notification:', err);
      setMessage('Failed to send test: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Settings</h1>

      <div className="settings-section">
        <h2>Account</h2>
        <div className="card">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>
      </div>

      <div className="settings-section">
        <h2>Push Notifications</h2>
        <div className="card">
          {message && (
            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'}`}>
              {message}
            </div>
          )}

          {pushStatus === 'loading' && <p>Checking notification status...</p>}

          {pushStatus === 'unsupported' && (
            <div className="alert alert-warning">
              Push notifications are not supported in this browser.
            </div>
          )}

          {pushStatus === 'denied' && (
            <div className="alert alert-error">
              Notifications are blocked. Please enable them in your browser settings.
            </div>
          )}

          {pushStatus === 'error' && (
            <div className="alert alert-error">
              Error checking notification status. Make sure you're using HTTPS.
            </div>
          )}

          {(pushStatus === 'default' || pushStatus === 'granted') && (
            <>
              <p style={{ marginBottom: '1rem' }}>
                {subscribed
                  ? 'Notifications are enabled. You will be reminded 7 days before each class.'
                  : 'Enable push notifications to get reminded 7 days before your classes.'}
              </p>

              {subscribed ? (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleTestNotification}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Test Notification'}
                  </button>
                  <button
                    onClick={handleDisableNotifications}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    {loading ? 'Disabling...' : 'Disable Notifications'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Enabling...' : 'Enable Notifications'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h2>How It Works</h2>
        <div className="card">
          <ul style={{ paddingLeft: '1.25rem' }}>
            <li>Add your table tennis classes to the app</li>
            <li>Enable push notifications</li>
            <li>You'll receive a reminder 7 days before each class</li>
            <li>This gives you time to cancel without penalty!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Settings;
