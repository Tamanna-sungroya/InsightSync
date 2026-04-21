import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase/config';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import Papa from 'papaparse';
import './App.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend
);

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    if (!auth || !googleProvider) {
      console.warn('Firebase not available, using demo login');
      setTimeout(() => {
        onLogin({
          uid: 'demo-user-' + Date.now(),
          name: 'Demo User',
          email: 'demo@example.com',
          photo: null
        });
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      console.log('Attempting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign-in successful:', result.user);
      onLogin({
        uid: result.user.uid,
        name: result.user.displayName || 'User',
        email: result.user.email,
        photo: result.user.photoURL
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request') {
        // User cancelled or closed popup
        setLoading(false);
        return;
      } else if (error.code === 'auth/popup-blocked') {
        alert('Popup blocked by browser. Please allow popups and try again.');
      } else {
        onLogin({
          uid: 'demo-user-' + Date.now(),
          name: 'Demo User',
          email: 'demo@example.com',
          photo: null
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-section">
          <h1>🚀 AI Revenue Dashboard</h1>
          <p>Next-Generation Business Analytics</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="google-login-btn"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            style={{ width: 20, height: 20 }}
          />
          {loading ? 'Signing in...' : (auth ? 'Continue with Google' : 'Demo Login')}
        </button>

        {!auth && (
          <p className="demo-notice">
            🔧 Firebase not configured - using demo mode
          </p>
        )}

        <div className="features-showcase">
          <h3>✨ Powerful Features</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <span className="feature-icon">🤖</span>
              <span>AI-Powered Analysis</span>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <span>Smart Visualizations</span>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💬</span>
              <span>Natural Language Queries</span>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📈</span>
              <span>Real-time Insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState([]);

  const quickQueries = [
    "Top 5 regions by revenue",
    "Revenue forecast next quarter",
    "Why did sales drop in March?",
    "Best performing products"
  ];

  // Multiple file upload handler
  const handleMultipleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(files);

    Promise.all(files.map(file => new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: res => resolve(res.data),
        error: err => reject(err)
      });
    }))).then(results => {
      // Merge all CSV data arrays
      const combined = [].concat(...results);
      setMergedData(combined);
    }).catch(err => {
      alert('Error parsing files: ' + err.message);
    });
  };

  const handleQuery = async (question) => {
    if (mergedData.length === 0) {
      alert('Please upload at least one CSV file!');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: question,
          data: mergedData,
          userEmail: user.email
        }),
      });
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      setInsights(data);
      setQueryHistory(prev => [...prev, { query: question, time: new Date() }]);
      setQuery('');
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const renderChart = () => {
    if (!insights?.chartData) return null;
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: insights.title, font: { size: 16, weight: 'bold' } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed.y ?? ctx.parsed;
              return `${ctx.dataset.label}: ₹${val.toLocaleString()}`;
            }
          }
        }
      },
      scales: insights.chartType !== 'pie' ? {
        y: { beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString() } }
      } : {},
    };
    const ChartComponent = insights.chartType === 'line' ? Line :
      insights.chartType === 'pie' ? Pie : Bar;
    return <ChartComponent data={insights.chartData} options={options} />;
  };

  // Export PDF function (basic)
  const exportPDF = () => {
    // You can enhance this with jsPDF or similar libraries
    alert('Export PDF feature coming soon!');
  };

  // Export PPT function (basic)
  const exportPPT = () => {
    alert('Export PPT feature coming soon!');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🚀 AI Revenue Dashboard</h1>
            <p>Welcome, {user.name}</p>
          </div>
          <div className="user-section">
            {user.photo ? <img src={user.photo} alt="User" className="profile-pic" /> :
             <div className="profile-placeholder">{user.name.charAt(0)}</div>}
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="upload-section">
          <div className="upload-box">
            <div className="user-greeting">
              <h2>Hello, {user.name}</h2>
              <p>Upload one or more CSV files to analyze your revenue data.</p>
            </div>

            <input
              type="file"
              accept=".csv"
              multiple
              id="file-upload"
              onChange={handleMultipleFileUpload}
              className="file-input"
            />
            <label htmlFor="file-upload" className="file-upload-label">
              {uploadedFiles.length > 0 ? (
                <div className="uploaded-files-list">
                  <ul>
                    {uploadedFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                  </ul>
                </div>
              ) : (
                <div className="file-placeholder">
                  <span className="upload-icon">📁</span>
                  <p>Click to select CSV files</p>
                </div>
              )}
            </label>
          </div>
        </section>

        {uploadedFiles.length > 0 && (
          <>
            <section className="query-section">
              <div className="query-box">
                <textarea
                  className="query-input"
                  placeholder="Ask your revenue data question..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  disabled={loading}
                />
                <button
                  disabled={loading || !query.trim()}
                  onClick={() => handleQuery(query)}
                  className="analyze-btn"
                >{loading ? 'Analyzing...' : 'Analyze'}</button>

                <div className="quick-queries">
                  <h3>Quick Queries</h3>
                  <div className="query-grid">
                    {quickQueries.map((q, i) => (
                      <button
                        className="quick-query-btn"
                        onClick={() => handleQuery(q)}
                        key={i}
                        disabled={loading}
                      >
                        {q}
                      </button>))}
                  </div>
                </div>
              </div>
            </section>

            {insights && (
              <section className="results-section">
                <div className="insights">
                  <h3>Insights</h3>
                  <p>{insights.textInsights}</p>

                  {insights.keyMetrics && (
                    <div className="metrics-grid">
                      {Object.entries(insights.keyMetrics).map(([key, val]) =>
                        <div key={key} className="metric-item">
                          <div className="metric-label">{key}</div>
                          <div className="metric-value">{val}</div>
                        </div>)}
                    </div>
                  )}

                  {insights.recommendations && (
                    <div className="recommendations">
                      <h4>Recommendations</h4>
                      <ul>
                        {insights.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  <div style={{ marginTop: 20 }}>
                    <button onClick={exportPDF} className="export-btn" style={{marginRight: 10}}>Export PDF</button>
                    <button onClick={exportPPT} className="export-btn">Export PPT</button>
                  </div>
                </div>

                <div className="chart-container">
                  {renderChart()}
                </div>
              </section>
            )}

            {queryHistory.length > 0 && (
              <section className="history-section">
                <h3>Recent Queries</h3>
                <ul>
                  {queryHistory.slice(-5).map((q, i) => (
                    <li key={i}>
                      <strong>{q.query}</strong> — {q.time.toLocaleTimeString()}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>

      {/* Add chatbot component here in future if needed */}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    if (auth && onAuthStateChanged) {
      try {
        unsubscribe = onAuthStateChanged(auth, currentUser => {
          if (currentUser) {
            setUser({
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email,
              email: currentUser.email,
              photo: currentUser.photoURL
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (auth && signOut) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error(error);
      }
    }
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return user ? <Dashboard user={user} onLogout={handleLogout} /> : <Login onLogin={setUser} />;
}

export default App;
