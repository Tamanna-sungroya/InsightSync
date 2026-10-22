import React, { useState, useEffect, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, firebaseConfigured, googleProvider } from './firebase/config';
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
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import './App.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const checkApiHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Backend health check failed (${response.status})`);
  }
  return response.json();
};

const getFirebaseAuthErrorMessage = (error, method) => {
  const messages = {
    'auth/configuration-not-found': 'Firebase Authentication has not been configured for this project. In Firebase Console, open Authentication → Get started, then enable Email/Password and Google under Sign-in method.',
    'auth/operation-not-allowed': `The ${method} sign-in provider is disabled. Enable it in Firebase Console under Authentication → Sign-in method.`,
    'auth/invalid-api-key': 'The Firebase API key is invalid. Check REACT_APP_FIREBASE_API_KEY in frontend/.env and restart the frontend.',
    'auth/app-not-authorized': 'This app is not authorized for the Firebase project. Verify the web app config and API key restrictions.',
    'auth/unauthorized-domain': 'This site is not authorized for Firebase sign-in. Add localhost under Firebase Console → Authentication → Settings → Authorized domains.',
    'auth/network-request-failed': 'Firebase could not be reached. Check your internet connection and try again.',
    'auth/email-already-in-use': 'An account already exists for this email. Sign in instead.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/popup-blocked': 'The sign-in popup was blocked. Allow popups for this site and try again.'
  };

  return messages[error.code] || error.message || `${method} failed. Please try again.`;
};

const getProfileStorageKey = (uid) => `insightsync-profile-${uid}`;

const getSavedProfile = (uid) => {
  try {
    const profile = JSON.parse(localStorage.getItem(getProfileStorageKey(uid)) || '{}');
    return {
      name: typeof profile.name === 'string' ? profile.name : '',
      photo: typeof profile.photo === 'string' ? profile.photo : ''
    };
  } catch (error) {
    console.error('Could not read saved profile:', error);
    return { name: '', photo: '' };
  }
};

const withSavedProfile = (user) => {
  const savedProfile = getSavedProfile(user.uid);
  return {
    ...user,
    name: savedProfile.name || user.name,
    photo: savedProfile.photo || user.photo || null
  };
};

const isGreeting = (text) => /^(hi|hello|hey|hiya|howdy|good morning|good afternoon|good evening)(?:[!,.?\s]+there)?[!,.?\s]*$/i.test(text.trim());

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend
);

const Login = ({ onLogin, onRegistrationStateChange }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    if (!auth || !googleProvider) {
      setError('Google sign-in is not configured yet. Add your Firebase settings, or use Demo Login to explore the dashboard.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin({
        uid: result.user.uid,
        name: result.user.displayName || 'User',
        email: result.user.email,
          photo: result.user.photoURL
        });
      } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user' &&
            error.code !== 'auth/cancelled-popup-request') {
            setError(getFirebaseAuthErrorMessage(error, 'Google'));
          }
      } finally {
        setLoading(false);
      }
  };

  const handleEmailAuth = async (event) => {
      event.preventDefault();
      setError('');
      setSuccess('');
      if (!auth) {
        setError('Email sign-in is not configured yet. Add your Firebase settings, or use Demo Login to explore the dashboard.');
        return;
      }

      setLoading(true);
      const creatingAccount = isSignUp;
      let createdUser = null;
      if (creatingAccount) {
        onRegistrationStateChange(true);
      }

      try {
        if (creatingAccount) {
          const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
          createdUser = result.user;
          let profileUpdateFailed = false;

          if (name.trim()) {
            try {
              await updateProfile(result.user, { displayName: name.trim() });
            } catch (profileError) {
              console.error('Account created, but the display name could not be saved:', profileError);
              profileUpdateFailed = true;
            }
          }

          await signOut(auth);
          setIsSignUp(false);
          setPassword('');
          setSuccess(
            profileUpdateFailed
              ? 'Your account was created. We could not save your display name; you can sign in and update your profile later.'
              : 'Your account was created. Sign in with your new email and password.'
          );
          return;
        }

        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        onLogin({
          uid: result.user.uid,
          name: result.user.displayName || name.trim() || email.split('@')[0],
          email: result.user.email,
          photo: result.user.photoURL
        });
      } catch (error) {
        if (createdUser && auth.currentUser?.uid === createdUser.uid) {
          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error('Could not sign out after account creation:', signOutError);
            setError('Your account was created, but automatic sign-out failed. Please sign out before continuing.');
            return;
          }
        }
        setError(getFirebaseAuthErrorMessage(error, creatingAccount ? 'Sign up' : 'Email/password'));
      } finally {
        if (creatingAccount) {
          onRegistrationStateChange(false);
        }
        setLoading(false);
      }
  };

  const handleDemoLogin = () => {
      setError('');
      const savedProfile = getSavedProfile('demo-user');
      onLogin({
        uid: 'demo-user',
        name: savedProfile.name || 'Demo User',
        email: 'demo@example.com',
        photo: savedProfile.photo || null
      });
  };

  return (
      <div className="login-container">
        <div className="login-box">
          <aside className="login-brand-panel">
            <div className="login-brand">
              <span className="brand-symbol">✦</span>
              <span>InsightSync</span>
            </div>
            <div className="brand-copy">
              <span className="brand-eyebrow">REVENUE INTELLIGENCE</span>
              <h1>Make better decisions with data.</h1>
              <p>Turn your revenue data into clear answers, useful insights, and confident next steps.</p>
            </div>
            <div className="brand-feature-list">
              <div><span>✦</span><span><strong>AI-powered analysis</strong><small>Ask questions in plain language</small></span></div>
              <div><span>▥</span><span><strong>Clear visual reports</strong><small>See patterns at a glance</small></span></div>
              <div><span>↗</span><span><strong>Actionable insights</strong><small>Turn trends into opportunities</small></span></div>
            </div>
            <span className="brand-footer">Your data. A clearer direction.</span>
          </aside>

          <section className="login-form-panel">
            <div className="login-form-heading">
              <span className="login-mobile-brand">✦ InsightSync</span>
              <h2>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
              <p>{isSignUp ? 'Sign up to start exploring your revenue data.' : 'Sign in to continue to your analytics workspace.'}</p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || !auth || !googleProvider}
              className="google-login-btn"
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="" />
              Continue with Google
            </button>

            <button type="button" className="demo-login-btn" onClick={handleDemoLogin} disabled={loading}>
              Explore with Demo Login <span aria-hidden="true">→</span>
            </button>
            {!firebaseConfigured && (
              <p className="firebase-setup-note">
                Google and email accounts need Firebase setup. Demo Login works now.
              </p>
            )}

            <div className="login-divider"><span>or continue with email</span></div>

            <form className="login-auth-form" onSubmit={handleEmailAuth}>
              {isSignUp && (
                <label className="auth-field">
                  <span>Full name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    required
                  />
                </label>
              )}
              <label className="auth-field">
                <span>Email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </label>
              {error && <p className="login-error" role="alert">{error}</p>}
              {success && <p className="login-success" role="status">{success}</p>}
              <button type="submit" className="email-auth-btn" disabled={loading || !auth}>
                {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <p className="auth-toggle">
              {isSignUp ? 'Already have an account?' : 'New to InsightSync?'}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccess('');
                }}
              >
                {isSignUp ? 'Sign in' : 'Create an account'}
              </button>
            </p>

          </section>
        </div>
      </div>
    );
};

const UserAvatar = ({ name, photo, className = 'profile-pic' }) => {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
      setImageFailed(false);
    }, [photo]);

    if (photo && !imageFailed) {
      return (
        <img
          src={photo}
          alt={`${name || 'User'} profile`}
          className={className}
          onError={() => setImageFailed(true)}
        />
      );
    }

    return (
      <div className={`${className} profile-placeholder`} aria-label={`${name || 'User'} profile`}>
        {(name || 'U').trim().charAt(0).toUpperCase()}
      </div>
    );
};

const Dashboard = ({ user, onLogout, onProfileUpdate }) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [mergedData, setMergedData] = useState([]);
    const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState([]);
  const [conversation, setConversation] = useState([{
    role: 'assistant',
    content: 'Hi! I’m your revenue analyst. Ask a question about your uploaded data and I’ll help uncover trends, comparisons, and opportunities.'
  }]);
  const [requestError, setRequestError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [exportMessage, setExportMessage] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(user.name || '');
  const [profilePhoto, setProfilePhoto] = useState(user.photo || getSavedProfile(user.uid).photo);
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const chartRef = useRef(null);
  const profileFileRef = useRef(null);

  const quickQueries = [
    "Top 5 regions by revenue",
    "Revenue forecast next quarter",
    "Why did sales drop in March?",
    "Best performing products"
  ];

  useEffect(() => {
    let cancelled = false;

    checkApiHealth()
      .then(() => {
        if (!cancelled) setBackendStatus('online');
      })
      .catch(() => {
        if (!cancelled) setBackendStatus('offline');
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;
    if (isGreeting(trimmedQuestion)) {
      const firstName = user.name && user.name !== 'Demo User'
        ? user.name.trim().split(/\s+/)[0]
        : '';
      setRequestError('');
      setConversation(prev => [
        ...prev,
        { role: 'user', content: trimmedQuestion },
        {
          role: 'assistant',
          content: `Hi${firstName ? `, ${firstName}` : ''}! I can help you explore your revenue data. Ask me about trends, top-performing regions or products, comparisons, or forecasts.`
        }
      ]);
      setQuery('');
      return;
    }
    if (mergedData.length === 0) {
      setRequestError('Upload a CSV file before asking a question.');
      return;
    }
    setRequestError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmedQuestion,
          data: mergedData,
          userEmail: user.email
        }),
      });
      if (!response.ok) {
        throw new Error(`The analysis service returned an error (${response.status}). Check the backend terminal for details.`);
      }
      const result = await response.json();
      setInsights(result);
      setConversation(prev => [
        ...prev,
        { role: 'user', content: trimmedQuestion },
        { role: 'assistant', content: result.textInsights || 'Analysis completed. See the report below for details.' }
      ]);
      setQueryHistory(prev => [...prev, { query: trimmedQuestion, time: new Date() }]);
      setQuery('');
    } catch (error) {
      if (error instanceof TypeError) {
        setRequestError(`Can't reach the backend at ${API_BASE_URL}. Start the Flask server and check that it is listening on port 5000.`);
        setBackendStatus('offline');
      } else {
        setRequestError(error.message);
      }
    } finally {
      setLoading(false);
    }
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
    return <ChartComponent ref={chartRef} data={insights.chartData} options={options} />;
  };

  const exportPDF = () => {
    if (!insights) return;
    setExportMessage('');

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const addTextBlock = (heading, content) => {
        if (!content) return;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        const headingLines = pdf.splitTextToSize(heading, contentWidth);
        const bodyLines = pdf.splitTextToSize(String(content), contentWidth);
        const requiredHeight = headingLines.length * 6 + bodyLines.length * 6 + 8;
        if (y + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(headingLines, margin, y);
        y += headingLines.length * 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(bodyLines, margin, y);
        y += bodyLines.length * 6 + 5;
      };

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text(insights.title || 'Revenue Analysis', margin, y);
      y += 9;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Prepared for ${user.name} · ${new Date().toLocaleString()}`, margin, y);
      y += 11;

      const chartImage = chartRef.current?.toBase64Image();
      if (chartImage) {
        const chartHeight = 76;
        if (y + chartHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.addImage(chartImage, 'PNG', margin, y, contentWidth, chartHeight);
        y += chartHeight + 8;
      }

      addTextBlock('Insights', insights.textInsights);
      if (insights.keyMetrics && Object.keys(insights.keyMetrics).length) {
        addTextBlock(
          'Key metrics',
          Object.entries(insights.keyMetrics).map(([key, value]) => `${key}: ${value}`).join('\n')
        );
      }
      if (insights.recommendations?.length) {
        addTextBlock('Recommendations', insights.recommendations.map(item => `• ${item}`).join('\n'));
      }

      pdf.save('insightsync-revenue-analysis.pdf');
      setExportMessage('PDF report downloaded.');
    } catch (error) {
      console.error('PDF export failed:', error);
      setExportMessage('Could not create the PDF. Please try again.');
    }
  };

  const exportPPT = async () => {
    if (!insights) return;
    setExportMessage('');

    try {
      const presentation = new PptxGenJS();
      presentation.layout = 'LAYOUT_WIDE';
      presentation.author = user.name;
      presentation.subject = 'Revenue analysis report';
      presentation.title = insights.title || 'Revenue Analysis';
      presentation.company = 'InsightSync';
      presentation.theme = {
        headFontFace: 'Aptos Display',
        bodyFontFace: 'Aptos',
        lang: 'en-US'
      };

      const titleSlide = presentation.addSlide();
      titleSlide.background = { color: 'F4F6FB' };
      titleSlide.addText(insights.title || 'Revenue Analysis', {
        x: 0.65, y: 0.6, w: 12, h: 0.65,
        fontFace: 'Aptos Display', fontSize: 28, bold: true, color: '1D2B43'
      });
      titleSlide.addText(`Prepared for ${user.name} · ${new Date().toLocaleDateString()}`, {
        x: 0.68, y: 1.35, w: 11.8, h: 0.35,
        fontSize: 12, color: '718096'
      });
      titleSlide.addText(insights.textInsights || 'No written insights available.', {
        x: 0.68, y: 2.05, w: 11.7, h: 2.1,
        fontSize: 18, color: '354157', breakLine: false, valign: 'top',
        paraSpaceAfterPt: 12, fit: 'shrink'
      });
      if (insights.keyMetrics && Object.keys(insights.keyMetrics).length) {
        const metricsText = Object.entries(insights.keyMetrics)
          .map(([key, value]) => `${key}: ${value}`)
          .join('     •     ');
        titleSlide.addText(metricsText, {
          x: 0.68, y: 4.55, w: 11.7, h: 1,
          fontSize: 14, bold: true, color: '5269B2', valign: 'top', fit: 'shrink'
        });
      }

      const detailsSlide = presentation.addSlide();
      detailsSlide.background = { color: 'FFFFFF' };
      detailsSlide.addText('Analysis details', {
        x: 0.65, y: 0.45, w: 12, h: 0.5,
        fontFace: 'Aptos Display', fontSize: 24, bold: true, color: '1D2B43'
      });
      const chartImage = chartRef.current?.toBase64Image();
      if (chartImage) {
        detailsSlide.addImage({ data: chartImage, x: 0.65, y: 1.15, w: 6.2, h: 4.4 });
      }
      if (insights.recommendations?.length) {
        detailsSlide.addText('Recommendations', {
          x: chartImage ? 7.1 : 0.75, y: 1.2, w: chartImage ? 5.5 : 11.4, h: 0.4,
          fontSize: 17, bold: true, color: '1D2B43'
        });
        detailsSlide.addText(
          insights.recommendations.map(item => ({ text: item, options: { bullet: { indent: 14 }, hanging: 3, breakLine: true } })),
          {
            x: chartImage ? 7.1 : 0.75, y: 1.8, w: chartImage ? 5.5 : 11.4, h: 4.4,
            fontSize: 13, color: '354157', paraSpaceAfterPt: 12, valign: 'top', fit: 'shrink'
          }
        );
      }

      await presentation.writeFile({ fileName: 'insightsync-revenue-analysis.pptx' });
      setExportMessage('PowerPoint presentation downloaded.');
    } catch (error) {
      console.error('PowerPoint export failed:', error);
      setExportMessage('Could not create the PowerPoint. Please try again.');
    }
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setProfileError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setProfileError('Profile images must be 1 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePhoto(reader.result);
      } else {
        setProfileError('Could not read that image. Please choose another file.');
      }
    };
    reader.onerror = () => setProfileError('Could not read that image. Please choose another file.');
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const trimmedName = profileName.trim();
    if (!trimmedName) {
      setProfileError('Enter a name for your profile.');
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    try {
      const updatedProfile = { name: trimmedName, photo: profilePhoto };
      await onProfileUpdate(updatedProfile);
      localStorage.setItem(getProfileStorageKey(user.uid), JSON.stringify(updatedProfile));
      setProfileOpen(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      setProfileError(error.message || 'Could not save your profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
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
            <button
              type="button"
              className="profile-trigger"
              onClick={() => {
                setProfileName(user.name || '');
                setProfilePhoto(user.photo || getSavedProfile(user.uid).photo);
                setProfileError('');
                setProfileOpen(true);
              }}
              aria-label="Edit user profile"
              title="Edit profile"
            >
              <UserAvatar name={user.name} photo={user.photo} />
            </button>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button
              type="button"
              className="edit-profile-btn"
              onClick={() => {
                setProfileName(user.name || '');
                setProfilePhoto(user.photo || getSavedProfile(user.uid).photo);
                setProfileError('');
                setProfileOpen(true);
              }}
            >
              Edit profile
            </button>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="upload-section">
          <div className="upload-box">
            <div className="user-greeting">
              <span className="eyebrow">REVENUE WORKSPACE</span>
              <h2>Good to see you, {user.name}</h2>
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
                  <span className="upload-icon">✓</span>
                  <ul>
                    {uploadedFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                  </ul>
                </div>
              ) : (
                <div className="file-placeholder">
                  <span className="upload-icon">📁</span>
                  <p><strong>Choose CSV files</strong></p>
                  <span>Click to browse · You can select multiple files</span>
                </div>
              )}
            </label>
          </div>
        </section>

        {uploadedFiles.length > 0 && (
          <>
            <section className="query-section">
                <div className="assistant-panel">
                  <div className="assistant-header">
                    <div className="assistant-heading">
                      <div className="assistant-mark" aria-hidden="true">✦</div>
                      <div>
                        <h2>Ask your revenue analyst</h2>
                        <p>Explore your data with natural-language questions</p>
                      </div>
                    </div>
                    <div className={`backend-status backend-status-${backendStatus}`} role="status">
                      <span className="status-dot" />
                      {backendStatus === 'online' ? 'Backend connected' :
                        backendStatus === 'checking' ? 'Checking service…' : 'AI service unavailable'}
                      {backendStatus === 'offline' && (
                        <button
                          type="button"
                          className="retry-status-btn"
                          onClick={() => {
                            setBackendStatus('checking');
                            checkApiHealth()
                              .then(() => setBackendStatus('online'))
                              .catch(() => setBackendStatus('offline'));
                          }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="chat-context">
                    <span className="context-file-icon" aria-hidden="true">▤</span>
                    <span><strong>{uploadedFiles.length} file{uploadedFiles.length === 1 ? '' : 's'}</strong> · {mergedData.length.toLocaleString()} rows ready</span>
                    <span className="context-divider" aria-hidden="true">|</span>
                    <span className="context-filenames">{uploadedFiles.map(file => file.name).join(', ')}</span>
                  </div>

                  <div className="chat-transcript" aria-live="polite">
                    {conversation.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`chat-message chat-message-${message.role}`}
                      >
                        <div className="chat-avatar" aria-hidden="true">
                          {message.role === 'assistant' ? '✦' : (user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="chat-message-content">
                          <span className="chat-sender">{message.role === 'assistant' ? 'InsightSync analyst' : 'You'}</span>
                          <p>{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="chat-message chat-message-assistant">
                        <div className="chat-avatar" aria-hidden="true">✦</div>
                        <div className="chat-message-content">
                          <span className="chat-sender">InsightSync analyst</span>
                          <p className="thinking-indicator"><span /> <span /> <span /> Analyzing your data…</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="chat-composer">
                    <label className="visually-hidden" htmlFor="revenue-question">Ask a question about your revenue data</label>
                    <textarea
                      id="revenue-question"
                      className="query-input"
                      placeholder="Ask a question about your revenue data…"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleQuery(query);
                        }
                      }}
                      disabled={loading}
                      rows={4}
                    />
                    <div className="composer-footer">
                      <span>Press Enter to send · Shift + Enter for a new line</span>
                      <button
                        disabled={loading || !query.trim()}
                        onClick={() => handleQuery(query)}
                        className="analyze-btn"
                      >
                        {loading ? 'Analyzing…' : 'Send question'} <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </div>

                  {requestError && (
                    <div className="request-error" role="alert">
                      <span aria-hidden="true">!</span>
                      <p>{requestError}</p>
                    </div>
                  )}

                  <div className="quick-queries">
                    <div className="quick-queries-heading">
                      <h3>Need a starting point?</h3>
                      <span>Try a suggested question</span>
                    </div>
                    <div className="query-grid">
                      {quickQueries.map((q, i) => (
                        <button
                          className="quick-query-btn"
                          onClick={() => handleQuery(q)}
                          key={i}
                          disabled={loading}
                        >
                          <span aria-hidden="true">↗</span>{q}
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
                    <button onClick={exportPDF} className="export-btn" style={{marginRight: 10}}>Download PDF</button>
                    <button onClick={exportPPT} className="export-btn">Download PowerPoint</button>
                    {exportMessage && <p className="export-message" role="status">{exportMessage}</p>}
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

      {profileOpen && (
        <div
          className="profile-modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !profileSaving) setProfileOpen(false);
          }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            <div className="profile-modal-heading">
              <div>
                <span className="eyebrow">YOUR ACCOUNT</span>
                <h2 id="profile-modal-title">Edit profile</h2>
                <p>Personalize how you appear in InsightSync.</p>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setProfileOpen(false)}
                disabled={profileSaving}
                aria-label="Close profile editor"
              >
                ×
              </button>
            </div>

            <form className="profile-form" onSubmit={handleSaveProfile}>
              <div className="profile-photo-row">
                <UserAvatar name={profileName} photo={profilePhoto} className="profile-editor-avatar" />
                <div>
                  <strong>Profile photo</strong>
                  <span>JPG, PNG, or WebP · up to 1 MB</span>
                  <div className="profile-photo-actions">
                    <button type="button" onClick={() => profileFileRef.current?.click()}>
                      Upload photo
                    </button>
                    {profilePhoto && (
                      <button type="button" className="remove-photo-btn" onClick={() => setProfilePhoto('')}>
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={profileFileRef}
                    className="file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfilePhotoChange}
                    aria-label="Upload a profile image"
                  />
                </div>
              </div>

              <label className="auth-field">
                <span>Display name</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={profileName}
                  onChange={event => setProfileName(event.target.value)}
                  maxLength={80}
                  required
                />
              </label>
              <label className="auth-field">
                <span>Email address</span>
                <input type="email" value={user.email || ''} readOnly />
              </label>

              {profileError && <p className="login-error" role="alert">{profileError}</p>}
              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={() => setProfileOpen(false)}
                  disabled={profileSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="email-auth-btn" disabled={profileSaving}>
                  {profileSaving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Add chatbot component here in future if needed */}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const registrationInProgress = useRef(false);

  useEffect(() => {
    let unsubscribe;
    if (auth && onAuthStateChanged) {
      try {
        unsubscribe = onAuthStateChanged(auth, currentUser => {
          if (currentUser) {
            if (!registrationInProgress.current) {
              setUser(withSavedProfile({
                uid: currentUser.uid,
                name: currentUser.displayName || currentUser.email,
                email: currentUser.email,
                photo: currentUser.photoURL
              }));
            }
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

  const handleLogin = (account) => {
    setUser(withSavedProfile(account));
  };

  const handleProfileUpdate = async (profile) => {
    if (!user) return;
    if (auth?.currentUser?.uid === user.uid) {
      await updateProfile(auth.currentUser, { displayName: profile.name });
    }
    setUser(current => (
      current?.uid === user.uid
        ? { ...current, name: profile.name, photo: profile.photo || null }
        : current
    ));
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return user
    ? <Dashboard user={user} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />
    : (
      <Login
        onLogin={handleLogin}
        onRegistrationStateChange={inProgress => {
          registrationInProgress.current = inProgress;
        }}
      />
    );
}

export default App;
