export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const getFileIcon = (fileType) => {
  if (fileType.startsWith("image/")) return "pi-image";
  if (fileType === "application/pdf") return "pi-file-pdf";
  if (fileType.includes("word") || fileType.includes("document"))
    return "pi-file-word";
  if (fileType.includes("excel") || fileType.includes("sheet"))
    return "pi-file-excel";
  if (fileType === "text/plain") return "pi-file";
  return "pi-paperclip";
};
