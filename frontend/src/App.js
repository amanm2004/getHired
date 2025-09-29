import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/SideBar";
import { AuthProvider } from "./contexts/AuthContext";
import JobSearchPage from "./pages/JobSearchPage";
import LandingPage from "./pages/LandingPage";
import ResumeAnalyzerPage from "./pages/ResumeAnalyzerPage";
import ResumeBuilderPage from "./pages/ResumeBuilderPage";
import SignInPage from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes - Full Screen Layout */}
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/signin" 
            element={
              <div className="auth-page-layout">
                <SignInPage />
              </div>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <div className="auth-page-layout">
                <SignUpPage />
              </div>
            } 
          />
          
          {/* Protected Routes - Sidebar Layout */}
          <Route
            path="/job-search"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Sidebar />
                  <main className="main-content">
                    <JobSearchPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-builder"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Sidebar />
                  <main className="main-content">
                    <ResumeBuilderPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-analyzer"
            element={
              <ProtectedRoute>
                <div className="app-container">
                  <Sidebar />
                  <main className="main-content">
                    <ResumeAnalyzerPage />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}