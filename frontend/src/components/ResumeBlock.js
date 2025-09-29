
function ResumeBlock({ block, onChange }) {
  const handleChange = (e) => {
    onChange(block.id, e.target.value);
  };

  return (
    <div
      style={{
        border: "1px dashed #ccc",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "5px",
        backgroundColor: "#f9f9f9"
      }}
    >
      <strong>{block.type.toUpperCase()}</strong>
      <textarea
        value={block.content}
        onChange={handleChange}
        style={{
          width: "100%",
          marginTop: "5px",
          fontFamily: "inherit",
          fontSize: "14px",
          resize: "vertical"
        }}
      />
    </div>
  );
}

export default ResumeBlock;
