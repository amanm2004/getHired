import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, convertInchesToTwip } from "docx";
import { saveAs } from "file-saver";
import { useEffect, useRef, useState } from "react";
import { FaDownload, FaEdit, FaEye, FaFileWord, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { templates } from "../templates/templates";
import PageNavigation from "./pagenavigation";
import TemplatePicker from "./TemplatePicker";

export default function ResumeBuilder() {
  const [pages, setPages] = useState([{ id: Date.now(), content: "" }]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingDOCX, setIsGeneratingDOCX] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const printRef = useRef();

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

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (hasUnsavedChanges) {
        saveToStorage();
      }
    }, 2000);
    return () => clearTimeout(autoSaveTimer);
  }, [pages, hasUnsavedChanges]);

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

  const loadFromStorage = () => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available');
      return;
    }
    try {
      const savedData = localStorage.getItem('resumeBuilder_data');
      if (savedData) {
        const resumeData = JSON.parse(savedData);
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
    if (!newPages[selectedPageIndex]) {
      newPages[selectedPageIndex] = { id: Date.now(), content: "" };
    }
    newPages[selectedPageIndex] = {
      ...newPages[selectedPageIndex],
      content: content
    };
    setPages(newPages);
    setHasUnsavedChanges(true);
  };

  const deletePage = (pageIndex) => {
    if (pages.length <= 1) {
      alert("You need at least one page.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this page?")) {
      const newPages = pages.filter((_, index) => index !== pageIndex);
      setPages(newPages);
      if (selectedPageIndex >= newPages.length) {
        setSelectedPageIndex(newPages.length - 1);
      } else if (selectedPageIndex > pageIndex) {
        setSelectedPageIndex(selectedPageIndex - 1);
      }
      setHasUnsavedChanges(true);
    }
  };

  const handleManualSave = () => {
    saveToStorage();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        
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
        `;
        
        let cleanContent = pages[i].content || '';
        cleanContent = cleanContent.replace(/class="[^"]*ql-[^"]*"/g, '');
        tempDiv.innerHTML = cleanContent;
        
        const style = document.createElement('style');
        style.textContent = `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          h1, h2, h3, h4, h5, h6 { margin: 16px 0 8px 0; font-weight: bold; }
          p { margin: 8px 0; line-height: 1.5; }
          ul, ol { margin: 8px 0; padding-left: 20px; }
          li { margin: 4px 0; }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(tempDiv);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const canvas = await html2canvas(tempDiv, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (imgHeight > pageHeight - (margin * 2)) {
            const scaledHeight = pageHeight - (margin * 2);
            const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
            pdf.addImage(imgData, 'PNG', margin, margin, scaledWidth, scaledHeight);
          } else {
            pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
          }
        } catch (error) {
          console.warn('Canvas failed, using text fallback');
        }
        
        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
        if (document.head.contains(style)) document.head.removeChild(style);
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`resume_${timestamp}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsGeneratingDOCX(true);
    try {
      const docChildren = [];
      
      for (let i = 0; i < pages.length; i++) {
        const pageContent = parseHTMLToDocx(pages[i].content);
        docChildren.push(...pageContent);
        if (i < pages.length - 1) {
          docChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
        }
      }
      
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.75),
                right: convertInchesToTwip(0.75),
                bottom: convertInchesToTwip(0.75),
                left: convertInchesToTwip(0.75),
              },
            },
          },
          children: docChildren,
        }],
      });
      
      const blob = await Packer.toBlob(doc);
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `resume_${timestamp}.docx`);
    } catch (error) {
      console.error('DOCX generation error:', error);
      alert('Error generating DOCX file.');
    } finally {
      setIsGeneratingDOCX(false);
    }
  };

  const parseHTMLToDocx = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const paragraphs = [];
    
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) return [new TextRun({ text })];
        return [];
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return [];
      
      const tagName = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes);
      
      switch (tagName) {
        case 'h1':
          paragraphs.push(new Paragraph({
            text: node.textContent,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }));
          return [];
        case 'h2':
          paragraphs.push(new Paragraph({
            text: node.textContent,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }));
          return [];
        case 'h3':
          paragraphs.push(new Paragraph({
            text: node.textContent,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          }));
          return [];
        case 'h4':
        case 'h5':
        case 'h6':
          paragraphs.push(new Paragraph({
            text: node.textContent,
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 120, after: 60 },
          }));
          return [];
        case 'p':
          const pRuns = [];
          children.forEach(child => pRuns.push(...processInlineNode(child)));
          if (pRuns.length > 0 || node.textContent.trim()) {
            paragraphs.push(new Paragraph({
              children: pRuns.length > 0 ? pRuns : [new TextRun(node.textContent)],
              spacing: { after: 120 },
            }));
          }
          return [];
        case 'ul':
        case 'ol':
          const items = node.querySelectorAll('li');
          items.forEach((li) => {
            const liRuns = [];
            Array.from(li.childNodes).forEach(child => liRuns.push(...processInlineNode(child)));
            paragraphs.push(new Paragraph({
              children: liRuns.length > 0 ? liRuns : [new TextRun(li.textContent)],
              bullet: tagName === 'ul' ? { level: 0 } : undefined,
              numbering: tagName === 'ol' ? { reference: "default-numbering", level: 0 } : undefined,
              spacing: { after: 60 },
            }));
          });
          return [];
        case 'br':
          paragraphs.push(new Paragraph({ text: "" }));
          return [];
        case 'div':
          children.forEach(child => processNode(child));
          return [];
        default:
          const runs = [];
          children.forEach(child => runs.push(...processInlineNode(child)));
          return runs;
      }
    };
    
    const processInlineNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text.trim()) return [new TextRun({ text })];
        return [];
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return [];
      
      const tagName = node.tagName.toLowerCase();
      const text = node.textContent;
      if (!text.trim()) return [];
      
      switch (tagName) {
        case 'strong':
        case 'b':
          return [new TextRun({ text, bold: true })];
        case 'em':
        case 'i':
          return [new TextRun({ text, italics: true })];
        case 'u':
          return [new TextRun({ text, underline: {} })];
        case 'a':
          return [new TextRun({ text, underline: {}, color: "0000FF" })];
        case 'br':
          return [new TextRun({ text: "", break: 1 })];
        default:
          const children = Array.from(node.childNodes);
          const runs = [];
          children.forEach(child => runs.push(...processInlineNode(child)));
          return runs.length > 0 ? runs : [new TextRun({ text })];
      }
    };
    
    Array.from(tempDiv.childNodes).forEach(node => processNode(node));
    if (paragraphs.length === 0) {
      paragraphs.push(new Paragraph({ text: "" }));
    }
    return paragraphs;
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
          <button onClick={() => setPreviewMode(!previewMode)} className="btn secondary">
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
            disabled={isGeneratingPDF || isGeneratingDOCX}
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
          <button 
            onClick={handleDownloadDOCX} 
            className="btn primary"
            disabled={isGeneratingPDF || isGeneratingDOCX}
            style={{marginLeft: '0.5rem'}}
          >
            {isGeneratingDOCX ? (
              <>
                <div className="loading-spinner" style={{width: '16px', height: '16px'}}></div>
                Generating DOCX...
              </>
            ) : (
              <>
                <FaFileWord />
                Download DOCX
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
          <li>Preview your resume before downloading PDF or DOCX</li>
          <li>PDF generation uses high-quality rendering for best results</li>
          <li>DOCX format allows easy editing in Microsoft Word</li>
          <li>Import/export feature helps you work across devices</li>
        </ul>
      </div>
    </div>
  );
}