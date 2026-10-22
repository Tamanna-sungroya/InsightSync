# InsightSync – Revenue Analytics Dashboard 📊

## 🤝 Team Project

**InsightSync – Revenue Analytics Dashboard** was developed as a **collaborative team project**.

This repository contains the **complete project**, including contributions from multiple team members across frontend development, backend implementation, AI integration, and analytics design.
The project is shared here to showcase the overall team effort and collaborative development experience.

---

## 🚀 Overview

**InsightSync** is an intelligent **Revenue Analytics Dashboard** designed to help businesses monitor revenue performance, analyze trends, and generate data-driven insights.

The platform transforms raw business data into meaningful visual analytics using interactive dashboards and AI-powered analysis.

---

## 🧠 Key Features

* 📈 Interactive revenue visualization dashboards
* 🔍 Dynamic filtering for real-time business analysis
* 📊 KPI monitoring and performance tracking
* 🤖 AI-powered trend analysis using LLM integration
* 🚨 Anomaly detection for revenue insights
* ⚡ Data-driven forecasting support

---

## 🛠️ Tech Stack

### **Frontend**

* React.js
* JavaScript
* HTML5
* CSS3
* Chart.js

### **Backend & AI**

* Python
* Gemini API
* LangChain
* NumPy

---

## 💡 Project Functionality

InsightSync enables organizations to:

* Visualize revenue trends over time
* Identify growth patterns and performance gaps
* Detect unusual revenue behavior automatically
* Generate actionable business insights using AI models

---

## 👩‍💻 My Contributions

As part of the team project, my primary contributions included:

* Contributed to frontend development using React.js
* Assisted in implementing interactive dashboard components and data visualizations
* Participated in integrating analytics features and UI improvements
* Collaborated with team members during feature development, testing, and refinement

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/InsightSync.git
cd InsightSync
```

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

### 3️⃣ Backend Setup

In a second terminal, from the repository root:

```bash
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

The frontend runs at `http://localhost:3000` and the API at `http://localhost:5000`. The backend accepts local development origins, including alternate localhost ports. Set `REACT_APP_API_URL` before starting the frontend if the API uses a different address.
The API uses Google's supported `google-genai` SDK with `gemini-3.5-flash`; if Google temporarily returns a rate-limit or server error, it retries once with `gemini-flash-lite-latest`. The health endpoint at `http://localhost:5000/health` reports the configured models and whether a Gemini key is configured.

---

## 🔐 Environment Variables

Create `backend/.env` and add:

```
GEMINI_API_KEY=your_api_key_here
```

To enable real email/password and Google sign-in:

1. In Firebase Console, open the project matching `REACT_APP_FIREBASE_PROJECT_ID`.
2. Open **Authentication** and choose **Get started** if Authentication has not been set up.
3. Under **Sign-in method**, enable **Email/Password** and **Google**.
4. Under **Settings → Authorized domains**, ensure `localhost` is listed for local development.
5. Add the Firebase web app settings to `frontend/.env`:

```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_DATABASE_URL=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
```

The `auth/configuration-not-found` error means the Firebase project does not yet have Authentication configured; setting environment variables alone cannot enable the Firebase service. Restart the frontend after updating the environment file or Firebase Console settings. Demo Login remains available without Firebase configuration.

*(Ensure `.env` is added to `.gitignore`.)*

## 📄 Profiles and Reports

After signing in, choose **Edit profile** to update your display name or upload a JPG, PNG, or WebP profile photo (up to 1 MB). The display name is saved to Firebase for authenticated accounts; profile photos are saved locally in the current browser.

Ask a revenue question to generate an analysis, then use **Download PDF** or **Download PowerPoint** in the report to export the insights, metrics, recommendations, and chart.

---

## 📊 Future Improvements

* Advanced forecasting models
* Role-based dashboards
* Exportable analytics reports
* Real-time database integration

---

## ⭐ Acknowledgment

Special thanks to all team members whose collaborative efforts contributed to the successful development of InsightSync.

---

## 📜 License

This project is intended for educational and demonstration purposes.
