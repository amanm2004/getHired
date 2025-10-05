import {
    FaArrowRight,
    FaFileAlt,
    FaMagic,
    FaPlay,
    FaRocket,
    FaSearch
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const features = [
    {
      icon: FaSearch,
      title: "Smart Job Search",
      description: "Find thousands of job opportunities from top companies with our intelligent search system.",
      iconClass: "job-search"
    },
    {
      icon: FaFileAlt,
      title: "Resume Builder", 
      description: "Create professional resumes with our easy-to-use templates and customization tools.",
      iconClass: "resume-builder"
    },
    {
      icon: FaMagic,
      title: "AI Resume Analyzer",
      description: "Get instant feedback and suggestions to improve your resume with AI-powered analysis.",
      iconClass: "resume-analyzer"
    }
  ];

  const stats = [
    { number: "50K+", label: "Jobs Available" },
    { number: "10K+", label: "Happy Users" },
    { number: "500+", label: "Companies" },
    { number: "95%", label: "Success Rate" }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Land Your Dream Job
          </h1>
          <p className="hero-subtitle">
            Your all-in-one platform for job searching, resume building, and career success
          </p>
          <p className="hero-description">
            GetHired combines powerful job search capabilities with professional resume tools 
            and AI-powered insights to help you stand out in today's competitive job market.
          </p>
          
          <div className="hero-cta">
            <Link to="/job-search" className="get-started-btn">
              <FaRocket />
              Get Started Now
            </Link>
            <Link to="/resume-builder" className="secondary-btn">
              <FaPlay />
              Build Resume
            </Link>
          </div>

          {/* Features Preview */}
          <div className="features-preview">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className={`feature-icon ${feature.iconClass}`}>
                  <feature.icon />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="stats-section">
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="cta-section">
            <p className="cta-text">
              Join thousands of job seekers who have found success with{' '}
              <span className="cta-highlight">GetHired</span>
            </p>
            <Link to="/job-search" className="get-started-btn">
              <FaArrowRight />
              Start Your Journey
            </Link>
          </div>

          {/* Education Disclaimer */}
          <footer className="education-disclaimer">
            <p>
              <strong>Disclaimer:</strong> This website, <span className="cta-highlight">GetHired</span>, 
              is a college project created solely for educational purposes. 
              It is not intended for commercial use, and all data or content displayed 
              is for demonstration only.
            </p>
          </footer>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
