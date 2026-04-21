import React, { useState } from 'react';
import Papa from 'papaparse';

const FileUpload = ({ onDataUpload, user }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const processCSV = async (file) => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        complete: (results) => {
          resolve(results.data);
        },
        header: true,
        skipEmptyLines: true
      });
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      const csvData = await processCSV(file);
      console.log('Processed CSV:', csvData);
      
      onDataUpload({
        data: csvData,
        fileName: file.name,
        uploadedBy: user.email,
        uploadedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error processing file. Please check CSV format.');
    }
    setUploading(false);
  };

  return (
    <div className="upload-container">
      <div className="upload-box">
        <div className="user-greeting">
          <h2>Welcome back, {user.name}! 👋</h2>
          <p>Upload your revenue data to get AI-powered insights</p>
        </div>

        <div className="upload-section">
          <h3>📊 Upload Your Revenue Data</h3>
          <p>CSV file with columns: Date, Region, Product, Revenue, etc.</p>
          
          <div className="file-input-wrapper">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="file-input"
              id="csv-file"
            />
            <label htmlFor="csv-file" className="file-label">
              {file ? (
                <div className="file-selected">
                  <span>📄 {file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="file-placeholder">
                  <span>📁 Choose CSV File</span>
                  <span>Drag & drop or click to browse</span>
                </div>
              )}
            </label>
          </div>
          
          <button 
            onClick={handleUpload}
            disabled={!file || uploading}
            className="upload-btn"
          >
            {uploading ? '⏳ Processing...' : '🚀 Upload & Analyze'}
          </button>
        </div>
        
        <div className="sample-queries">
          <h3>✨ Questions You Can Ask:</h3>
          <div className="query-examples">
            <span className="query-tag">"Compare Q1 vs Q2 revenue"</span>
            <span className="query-tag">"Top performing regions"</span>
            <span className="query-tag">"Sales forecast next month"</span>
            <span className="query-tag">"Why did revenue drop in March?"</span>
            <span className="query-tag">"Best selling products"</span>
            <span className="query-tag">"Revenue by sales rep"</span>
          </div>
        </div>

        <div className="csv-format-help">
          <h4>📝 Expected CSV Format:</h4>
          <div className="format-example">
            <code>Date,Region,Product,Revenue,Units_Sold</code><br/>
            <code>2024-01-15,North,Product A,120000,240</code><br/>
            <code>2024-01-15,South,Product B,150000,300</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
