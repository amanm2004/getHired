import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useRef, useState } from "react";
import { FaDownload, FaEdit, FaEye, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { templates } from "../templates/templates";
import PageNavigation from "./pagenavigation";
import TemplatePicker from "./TemplatePicker";

export default function ResumeBuilder() {
  const [pages, setPages] = useState([{ id: Date.now(), content: "" }]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const printRef = useRef();

  // Check if localStorage is available
  const isLocalStorageAvailable = () => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Load saved content on component mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (hasUnsavedChanges) {
        saveToStorage();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [pages, hasUnsavedChanges]);

  // Save to localStorage
  const saveToStorage = () => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return;
    }
    
    try {
      const resumeData = {
        pages,
        selectedPageIndex,
        lastSaved: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('resumeBuilder_data', JSON.stringify(resumeData));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Show brief save confirmation
      const saveIndicator = document.createElement('div');
      saveIndicator.textContent = '✓ Saved';
      saveIndicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        z-index: 1000;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
      `;
      document.body.appendChild(saveIndicator);
      
      setTimeout(() => {
        if (document.body.contains(saveIndicator)) {
          document.body.removeChild(saveIndicator);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  // Load from localStorage
  const loadFromStorage = () => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return;
    }
    
    try {
      const savedData = localStorage.getItem('resumeBuilder_data');
      if (savedData) {
        const resumeData = JSON.parse(savedData);
        
        // Validate the data structure
        if (resumeData.pages && Array.isArray(resumeData.pages)) {
          setPages(resumeData.pages);
          setSelectedPageIndex(resumeData.selectedPageIndex || 0);
          setLastSaved(new Date(resumeData.lastSaved));
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  };

  // Clear all saved data
  const clearSavedData = () => {
    if (!isLocalStorageAvailable()) {
      alert('localStorage is not available');
      return;
    }
    
    if (window.confirm('Are you sure you want to clear all saved resume data? This cannot be undone.')) {
      localStorage.removeItem('resumeBuilder_data');
      setPages([{ id: Date.now(), content: "" }]);
      setSelectedPageIndex(0);
      setLastSaved(null);
      setHasUnsavedChanges(false);
    }
  };

  const currentPage = pages[selectedPageIndex] || { id: Date.now(), content: "" };

  const applyTemplate = (template) => {
    const newPage = { id: Date.now(), content: template.content };
    setPages([newPage]);
    setSelectedPageIndex(0);
    setHasUnsavedChanges(true);
  };

  const addNewPage = () => {
    const newPage = { id: Date.now(), content: "" };
    setPages([...pages, newPage]);
    setSelectedPageIndex(pages.length);
    setHasUnsavedChanges(true);
  };

  const switchPage = (index) => {
    // Save current page content before switching
    if (selectedPageIndex !== index) {
      const currentContent = pages[selectedPageIndex]?.content || "";
      const updatedPages = [...pages];
      updatedPages[selectedPageIndex] = {
        ...updatedPages[selectedPageIndex],
        content: currentContent
      };
      setPages(updatedPages);
    }
    setSelectedPageIndex(index);
  };

  const updateContent = (content) => {
    const newPages = [...pages];
    // Ensure the page exists
    if (!newPages[selectedPageIndex]) {
      newPages[selectedPageIndex] = { id: Date.now(), content: "" };
    }
    // Update the content for the current page
    newPages[selectedPageIndex] = {
      ...newPages[selectedPageIndex],
      content: content
    };
    setPages(newPages);
    setHasUnsavedChanges(true);
  };

  // Add this function to handle page deletion
  const deletePage = (pageIndex) => {
    if (pages.length <= 1) {
      alert("You need at least one page.");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this page?")) {
      const newPages = pages.filter((_, index) => index !== pageIndex);
      setPages(newPages);
      
      // Adjust selected page index if necessary
      if (selectedPageIndex >= newPages.length) {
        setSelectedPageIndex(newPages.length - 1);
      } else if (selectedPageIndex > pageIndex) {
        setSelectedPageIndex(selectedPageIndex - 1);
      }
      
      setHasUnsavedChanges(true);
    }
  };

  // Manual save function
  const handleManualSave = () => {
    saveToStorage();
  };

  // Improved PDF generation with html2canvas
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        // Create a visible temporary div for better rendering
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: -100vw;
          width: 794px;
          min-height: 1123px;
          padding: 40px;
          background-color: #ffffff;
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #000000;
          box-sizing: border-box;
          z-index: -1000;
          overflow: hidden;
          border: none;
          box-shadow: none;
        `;
        
        // Clean the HTML content and remove any problematic elements
        let cleanContent = pages[i].content || '';
        
        // Remove Quill editor classes and styles that might interfere
        cleanContent = cleanContent.replace(/class="[^"]*ql-[^"]*"/g, '');
        cleanContent = cleanContent.replace(/style="[^"]*"/g, '');
        
        // Convert HTML to a more PDF-friendly format
        cleanContent = cleanContent.replace(/<div[^>]*>/g, '<p>');
        cleanContent = cleanContent.replace(/<\/div>/g, '</p>');
        cleanContent = cleanContent.replace(/<p><\/p>/g, '<br>');
        
        tempDiv.innerHTML = cleanContent;
        
        // Apply clean, PDF-friendly styles
        const style = document.createElement('style');
        style.textContent = `
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body { 
            background: white !important; 
            color: black !important;
          }
          h1, h2, h3, h4, h5, h6 { 
            margin: 16px 0 8px 0; 
            font-weight: bold; 
            color: #000000 !important;
            font-family: Arial, sans-serif;
          }
          h1 { font-size: 22px; }
          h2 { font-size: 18px; }
          h3 { font-size: 16px; }
          h4, h5, h6 { font-size: 14px; }
          p { 
            margin: 8px 0; 
            line-height: 1.5;
            color: #000000 !important;
            font-family: Arial, sans-serif;
            font-size: 14px;
          }
          ul, ol { 
            margin: 8px 0; 
            padding-left: 20px;
          }
          li { 
            margin: 4px 0; 
            line-height: 1.4;
            color: #000000 !important;
            font-family: Arial, sans-serif;
            font-size: 14px;
          }
          strong, b { 
            font-weight: bold !important;
            color: #000000 !important;
          }
          em, i { 
            font-style: italic;
            color: #000000 !important;
          }
          br { 
            margin: 4px 0;
          }
          span {
            color: #000000 !important;
          }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(tempDiv);
        
        try {
          // Wait for rendering
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Use html2canvas with optimized settings for PDF
          const canvas = await html2canvas(tempDiv, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            width: 794,
            height: tempDiv.scrollHeight || 1123,
            backgroundColor: '#ffffff',
            foreignObjectRendering: false,
            allowTaint: false,
            imageTimeout: 15000,
            removeContainer: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794,
            windowHeight: tempDiv.scrollHeight || 1123,
            ignoreElements: (element) => {
              return element.classList && (
                element.classList.contains('ql-toolbar') ||
                element.classList.contains('ql-tooltip')
              );
            }
          });
          
          // Check if canvas is valid and not empty
          if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas rendering failed');
          }
          
          // Check if the canvas is all black or white
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
          const data = imageData.data;
          let isAllBlack = true;
          let isAllWhite = true;
          
          for (let j = 0; j < data.length; j += 4) {
            const r = data[j], g = data[j+1], b = data[j+2];
            if (r > 50 || g > 50 || b > 50) isAllBlack = false;
            if (r < 200 || g < 200 || b < 200) isAllWhite = false;
          }
          
          if (isAllBlack) {
            throw new Error('Rendered canvas is all black');
          }
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add image to PDF
          if (imgHeight > pageHeight - (margin * 2)) {
            const scaledHeight = pageHeight - (margin * 2);
            const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
            pdf.addImage(imgData, 'PNG', margin, margin, scaledWidth, scaledHeight);
          } else {
            pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
          }
          
        } catch (canvasError) {
          console.warn('html2canvas failed, using text fallback:', canvasError);
          
          // Enhanced text fallback with better formatting
          const textContent = extractFormattedTextAdvanced(pages[i].content);
          
          let yPosition = margin + 10;
          const maxWidth = pageWidth - (margin * 2);
          
          textContent.forEach(item => {
            if (yPosition > pageHeight - margin - 10) {
              pdf.addPage();
              yPosition = margin + 10;
            }
            
            // Set font based on item type
            switch (item.type) {
              case 'h1':
                pdf.setFontSize(18);
                pdf.setFont('helvetica', 'bold');
                break;
              case 'h2':
                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                break;
              case 'h3':
              case 'h4':
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                break;
              case 'li':
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'normal');
                item.text = '• ' + item.text;
                break;
              case 'strong':
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                break;
              default:
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'normal');
            }
            
            if (item.text.trim()) {
              const lines = pdf.splitTextToSize(item.text, maxWidth);
              lines.forEach(line => {
                if (yPosition > pageHeight - margin - 10) {
                  pdf.addPage();
                  yPosition = margin + 10;
                }
                pdf.text(line, margin, yPosition);
                yPosition += item.type.startsWith('h') ? 8 : 6;
              });
              yPosition += item.type.startsWith('h') ? 4 : 2;
            }
          });
        }
        
        // Clean up
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`resume_${timestamp}.pdf`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try using the text-based fallback or check your content formatting.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Enhanced text extraction for fallback
  const extractFormattedTextAdvanced = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const result = [];
    
    const processElement = (element) => {
      if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent.trim();
        if (text) {
          result.push({ type: 'text', text: text });
        }
        return;
      }
      
      if (element.nodeType !== Node.ELEMENT_NODE) return;
      
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent.trim();
      
      if (!text) return;
      
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          result.push({ type: tagName, text: text });
          break;
        case 'p':
          result.push({ type: 'p', text: text });
          break;
        case 'li':
          result.push({ type: 'li', text: text });
          break;
        case 'strong':
        case 'b':
          result.push({ type: 'strong', text: text });
          break;
        case 'br':
          result.push({ type: 'br', text: '\n' });
          break;
        default:
          if (element.children.length === 0) {
            result.push({ type: 'text', text: text });
          } else {
            Array.from(element.childNodes).forEach(child => {
              processElement(child);
            });
          }
      }
    };
    
    Array.from(tempDiv.childNodes).forEach(child => {
      processElement(child);
    });
    
    return result;
  };

  // Helper function to extract and format text from HTML (fallback)
  const extractFormattedText = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Replace HTML elements with formatted text
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.textContent = '\n\n' + heading.textContent.toUpperCase() + '\n';
    });
    
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(p => {
      if (p.textContent.trim()) {
        p.textContent = p.textContent + '\n\n';
      }
    });
    
    const listItems = tempDiv.querySelectorAll('li');
    listItems.forEach(li => {
      li.textContent = '• ' + li.textContent + '\n';
    });
    
    // Handle line breaks
    tempDiv.innerHTML = tempDiv.innerHTML.replace(/<br\s*\/?>/gi, '\n');
    
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const modules = {
    toolbar: [
      [{ font: [] }],
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <div className="resume-editor-container">
      <div className="builder-header">
        <h2 className="builder-title">Professional Resume Builder</h2>
        <p className="builder-subtitle">
          Create, edit, and download your professional resume with our advanced editor
        </p>
        
        {/* Save Status */}
        {isLocalStorageAvailable() && (
          <div className="save-status" style={{
            textAlign: 'center',
            marginTop: '1rem',
            color: 'var(--gray-600)',
            fontSize: '0.9rem'
          }}>
            {lastSaved && (
              <span>
                Last saved: {lastSaved.toLocaleString()}
                {hasUnsavedChanges && <span style={{color: 'var(--warning)'}}> • Unsaved changes</span>}
              </span>
            )}
            {!lastSaved && hasUnsavedChanges && (
              <span style={{color: 'var(--warning)'}}>Not saved yet</span>
            )}
          </div>
        )}
      </div>

      <TemplatePicker templates={templates} onSelect={applyTemplate} />
      
      <div className="editor-controls">
        <div className="control-group">
          <button onClick={addNewPage} className="btn secondary">
            <FaPlus /> Add Page
          </button>
          <button 
            onClick={() => setPreviewMode(!previewMode)} 
            className="btn secondary"
          >
            {previewMode ? <FaEdit /> : <FaEye />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          {isLocalStorageAvailable() && (
            <>
              <button onClick={handleManualSave} className="btn secondary">
                <FaSave /> Save Now
              </button>
              <button onClick={clearSavedData} className="btn secondary" style={{color: 'var(--error)'}}>
                <FaTrash /> Clear All
              </button>
            </>
          )}
        </div>

        <div className="control-group">
          <button 
            onClick={handleDownloadPDF} 
            className="btn primary"
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <div className="loading-spinner" style={{width: '16px', height: '16px'}}></div>
                Generating PDF...
              </>
            ) : (
              <>
                <FaDownload />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      <PageNavigation 
        pages={pages} 
        selectedPageIndex={selectedPageIndex} 
        switchPage={switchPage}
        deletePage={deletePage}
        addNewPage={addNewPage}
      />

      <div className="editor-wrapper" ref={printRef}>
        {previewMode ? (
          <div className="preview-mode" style={{
            padding: '2rem',
            backgroundColor: 'white',
            minHeight: '600px',
            fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
            lineHeight: '1.6',
            color: '#333',
            fontSize: '14px'
          }}>
            <div dangerouslySetInnerHTML={{ __html: currentPage.content }} />
          </div>
        ) : (
          <ReactQuill
            theme="snow"
            value={currentPage.content || ""}
            onChange={updateContent}
            modules={modules}
            style={{ minHeight: "600px" }}
            placeholder="Start typing your resume content here..."
          />
        )}
      </div>

      {/* Enhanced Tips */}
      <div className="upload-hints" style={{ marginTop: '2rem' }}>
        <h4>Resume Builder Tips</h4>
        <ul className="hints-list">
          {isLocalStorageAvailable() ? (
            <>
              <li>Your work is automatically saved every 2 seconds</li>
              <li>Content persists when you refresh or switch pages</li>
            </>
          ) : (
            <li>Note: Auto-save is disabled (localStorage not available)</li>
          )}
          <li>Use templates as starting points for professional layouts</li>
          <li>Preview your resume before downloading PDF</li>
          <li>PDF generation uses high-quality rendering for best results</li>
          <li>Import/export feature helps you work across devices</li>
        </ul>
      </div>
    </div>
  );
}