import React from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({ insights, user }) => {
  const renderChart = () => {
    const { chartType, chartData } = insights;
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: insights.title || 'Revenue Analysis',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y || context.parsed;
              return `${label}: ₹${value.toLocaleString()}`;
            }
          }
        }
      },
      scales: chartType !== 'pie' ? {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toLocaleString();
            }
          }
        }
      } : {}
    };

    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  const exportData = () => {
    const exportData = {
      analysis: insights,
      user: user.email,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue_analysis_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareInsights = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Revenue Analysis Insights',
        text: insights.textInsights,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(insights.textInsights);
      alert('Insights copied to clipboard!');
    }
  };

  return (
    <div className="dashboard">
      <div className="insights-section">
        <div className="insights-header">
          <h3>🧠 AI Insights</h3>
          <div className="analysis-meta">
            <span className="timestamp">📅 {insights.timestamp}</span>
            <span className="analyzed-for">👤 {insights.analyzedFor}</span>
          </div>
        </div>
        
        <div className="insight-text">
          {insights.textInsights}
        </div>
        
        <div className="chart-info">
          <div className="info-row">
            <strong>Chart Type:</strong> 
            <span className="chart-type-badge">{insights.chartType.toUpperCase()}</span>
          </div>
          <div className="info-row">
            <strong>Analysis Title:</strong> {insights.title}
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={shareInsights} className="share-btn">
            🔗 Share Insights
          </button>
          <button onClick={exportData} className="export-btn">
            💾 Export Data
          </button>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>📊 Data Visualization</h3>
          <div className="chart-controls">
            <span className="chart-type">Type: {insights.chartType}</span>
          </div>
        </div>
        
        <div className="chart-container">
          {renderChart()}
        </div>
        
        <div className="chart-footer">
          <p className="chart-description">
            This {insights.chartType} chart visualizes your revenue data based on the AI analysis. 
            The insights above provide detailed interpretation of the patterns shown.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
