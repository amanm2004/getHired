import { useState } from "react";
import { FaCheckCircle, FaFileAlt, FaFileUpload, FaSpinner } from "react-icons/fa";
import "../App.css";

export default function ResumeAnalyzerPage() {
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(""); // Clear any previous errors
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setError("");

    if (!file) {
      setError("Please select a file first.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload PDF, DOC, DOCX, TXT, JPG, or PNG files.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Please select a file smaller than 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/analyze_resume`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || `Server responded with status ${res.status}`);
      } else {
        // Split feedback by line breaks for better display
        const lines = data.feedback.split("\n").filter(line => line.trim());
        setFeedback(lines);
      }

      // Reset form but keep the results
      setFile(null);
      if (e.target) e.target.reset();
    } catch (err) {
      console.error(err);
      setError("Network error: Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="page">
      <div className="aggregator-header">
        <h1 className="page-title">AI Resume Analyzer</h1>
        <p className="page-subtitle">
          Get instant feedback on your resume with our AI-powered analysis. 
          Improve your chances of landing your dream job with personalized suggestions.
        </p>
      </div>

      {/* Upload Tips */}
      <div className="upload-hints">
        <h4>Tips for Best Results</h4>
        <ul className="hints-list">
          <li>Use a clear, well-formatted resume</li>
          <li>Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG</li>
          <li>File size should be under 5MB</li>
          <li>Ensure text is readable and not blurry</li>
        </ul>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="upload-form">
        <div 
          className="upload-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FaFileUpload style={{ fontSize: '3rem', color: 'var(--primary-500)', marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
            Drop your resume here or click to browse
          </h3>
          <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
            PDF, DOC, DOCX, TXT, JPG, PNG (max 5MB)
          </p>
          
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.png"
            onChange={handleFileSelect}
            style={{ marginBottom: file ? '0' : '1.5rem' }}
          />
        </div>

        {file && (
          <div className="file-info">
            <FaFileAlt />
            <span>
              {file.name} ({formatFileSize(file.size)})
            </span>
            <FaCheckCircle style={{ color: 'var(--success)' }} />
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading || !file}>
          {loading ? (
            <>
              <FaSpinner className="analyzing-spinner" style={{ width: '16px', height: '16px' }} />
              Analyzing Resume...
            </>
          ) : (
            <>
              <FaFileUpload />
              Analyze My Resume
            </>
          )}
        </button>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="analyzing-container">
          <div className="analyzing-spinner"></div>
          <p className="analyzing-text">Analyzing your resume...</p>
          <p className="analyzing-subtext">
            Our AI is reviewing your resume structure, content, and formatting
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card card-error">
          <h3>Analysis Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Success/Feedback State */}
      {feedback && !loading && (
        <div className="card card-feedback">
          <h3>AI Analysis Results</h3>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--gray-600)', fontStyle: 'italic' }}>
              Based on our analysis, here are personalized recommendations to improve your resume:
            </p>
          </div>
          <ul>
            {feedback.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
          
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'var(--primary-50)', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--primary-700)', fontWeight: '500', margin: '0' }}>
              💡 Want to apply these suggestions? Use our Resume Builder to create an improved version!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}