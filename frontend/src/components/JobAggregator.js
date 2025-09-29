import { useState } from "react";
import { FaBriefcase, FaExclamationCircle, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import AuthService from "../services/AuthService";
import JobCard from "./JobCard";

function JobAggregator() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("India");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  // const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
  const searchUrl = `https://gethired-3-su4n.onrender.com/api/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setJobs([]);
    setHasSearched(true);
    setError("");
    
    try {
      // Use authenticated fetch
      const response = await AuthService.authenticatedFetch(
        `${API_URL}/api/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-aggregator-container">
      {/* Header */}
      <div className="aggregator-header">
        <h1 className="aggregator-title">Find Your Dream Job</h1>
        <p className="aggregator-subtitle">
          Search thousands of job opportunities from top companies across India
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-inputs">
          <div className="input-group">
            <label htmlFor="job-query" className="input-label">
              <FaBriefcase /> Job Title or Keywords
            </label>
            <input
              id="job-query"
              type="text"
              placeholder="e.g. React Developer, Marketing Manager..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="location" className="input-label">
              <FaMapMarkerAlt /> Location
            </label>
            <input
              id="location"
              type="text"
              placeholder="City, State, or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="search-button"
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Searching...
              </>
            ) : (
              <>
                <FaSearch />
                Search Jobs
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="card card-error">
          <h3>Search Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Searching for the best opportunities...</p>
        </div>
      )}

      {/* Results Section */}
      {!loading && hasSearched && !error && (
        <>
          {jobs.length > 0 ? (
            <>
              <div className="results-header">
                <p className="results-count">
                  Found <span className="count-number">{jobs.length}</span> job{jobs.length !== 1 ? 's' : ''} 
                  {query && ` for "${query}"`}
                  {location && location !== "India" && ` in ${location}`}
                </p>
                <div className="sort-controls">
                  <label htmlFor="sort-select" className="sort-label">Sort by:</label>
                  <select id="sort-select" className="sort-select">
                    <option value="relevance">Relevance</option>
                    <option value="date">Date Posted</option>
                    <option value="company">Company</option>
                  </select>
                </div>
              </div>

              <ul className="jobs-list">
                {jobs.map((job, index) => (
                  <li key={`${job.id || job.title}-${index}`}>
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="empty-state">
              <FaExclamationCircle className="empty-icon" />
              <h3 className="empty-title">No Jobs Found</h3>
              <p className="empty-text">
                Try adjusting your search terms or location to find more opportunities.
              </p>
            </div>
          )}
        </>
      )}

      {/* Initial State - Before Search */}
      {!hasSearched && !loading && (
        <div className="empty-state">
          <FaBriefcase className="empty-icon" />
          <h3 className="empty-title">Ready to Find Your Next Job?</h3>
          <p className="empty-text">
            Enter your desired job title and location above to get started.
          </p>
        </div>
      )}
    </div>
  );
}

export default JobAggregator;