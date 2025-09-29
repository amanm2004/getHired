
function JobCard({ job }) {
  const handleClick = () => {
    if (job.url) {
      window.open(job.url, "_blank");
    } else {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        job.title + " " + job.company + " " + job.location
      )}`;
      window.open(searchUrl, "_blank");
    }
  };

  return (
    <li
      onClick={handleClick}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        marginBottom: "10px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        cursor: "pointer",
        transition: "transform 0.1s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <h2 style={{ margin: "0 0 5px 0" }}>{job.title}</h2>
      <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
        {job.company} — {job.location}
      </p>
      {job.description && (
        <p style={{ margin: "0 0 5px 0", color: "#555" }}>
          {job.description.length > 200
            ? job.description.substring(0, 200) + "..."
            : job.description}
        </p>
      )}
      {/* {job.contact ? (
        <p style={{ margin: 0, color: "#333", fontStyle: "italic" }}>
          Contact: {job.contact}
        </p>
      ) : (
        <p style={{ margin: 0, color: "#333", fontStyle: "italic" }}>
          Contact: Not provided
        </p>
      )} */}
    </li>
  );
}

export default JobCard;
