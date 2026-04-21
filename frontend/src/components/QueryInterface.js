import React, { useState } from 'react';

const QueryInterface = ({ data, onInsights, loading, setLoading, user }) => {
  const [query, setQuery] = useState('');

  const quickQueries = [
    "Top 5 regions by revenue this quarter",
    "Compare this month vs last month performance", 
    "Revenue forecast for next quarter",
    "Why did sales drop in recent weeks?",
    "Best performing products analysis",
    "Revenue breakdown by sales representative",
    "Monthly growth trends analysis",
    "Identify underperforming regions"
  ];

  const handleSubmit = async (queryText) => {
    if (!queryText.trim()) return;
    
    setLoading(true);
    try {
      console.log('Sending query:', queryText);
      
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText,
          data: data.data,
          userEmail: user.email
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Received result:', result);
      
      onInsights(result);
      setQuery(''); // Clear input after successful query
      
      // Save query to user history (optional)
      await saveQueryToHistory(queryText, result);
      
    } catch (error) {
      console.error('Query error:', error);
      alert('Error connecting to backend. Make sure Flask server is running on port 5000!');
    }
    setLoading(false);
  };

  const saveQueryToHistory = async (query, result) => {
    try {
      await fetch('http://localhost:5000/api/save-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          query: query,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.log('Could not save query history:', error);
    }
  };

  return (
    <div className="query-interface">
      <div className="query-header">
        <h2>🤖 Ask Your Business Question</h2>
        <div className="file-info">
          <span className="file-badge">📄 {data.fileName}</span>
          <span className="row-count">{data.data.length} rows loaded</span>
          <span className="user-badge">👤 {user.name}</span>
        </div>
      </div>
      
      <div className="query-input-section">
        <div className="input-wrapper">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask anything about your revenue data...\nExample: 'Show me top performing regions this quarter' or 'Why did sales drop in March?'`}
            className="query-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(query);
              }
            }}
            disabled={loading}
          />
          <div className="input-actions">
            <button 
              onClick={() => handleSubmit(query)}
              disabled={loading || !query.trim()}
              className="analyze-btn"
            >
              {loading ? (
                <>⏳ Analyzing...</>
              ) : (
                <>🚀 Analyze</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="quick-queries">
        <h3>⚡ Quick Questions:</h3>
        <div className="query-grid">
          {quickQueries.map((q, index) => (
            <button
              key={index}
              onClick={() => handleSubmit(q)}
              className="quick-query-btn"
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>🧠 AI is analyzing your data...</p>
        </div>
      )}
    </div>
  );
};

export default QueryInterface;
