import { FaPlus, FaTrash } from 'react-icons/fa';

const PageNavigation = ({ pages, selectedPageIndex, switchPage, deletePage, addNewPage }) => {
  return (
    <div className="page-navigation">
      <span className="nav-label">Pages:</span>
      
      {pages.map((page, index) => (
        <div key={page.id} className="page-nav-item">
          <button 
            className={`page-btn ${selectedPageIndex === index ? 'active' : ''}`}
            onClick={() => switchPage(index)}
          >
            Page {index + 1}
          </button>
          
          {pages.length > 1 && (
            <button 
              className="page-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deletePage(index);
              }}
              title="Delete this page"
            >
              <FaTrash />
            </button>
          )}
        </div>
      ))}
      
      <button 
        className="page-add-btn"
        onClick={addNewPage}
        title="Add new page"
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default PageNavigation;