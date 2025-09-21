import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { uploadFile } from '../services/firebaseService';

function FileUpload({ roomId, username, onFileUploaded, disabled }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be less than 5MB');
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Please upload images, PDFs, or documents.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const fileUrl = await uploadFile(
        file,
        roomId,
        username,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      await onFileUploaded(file.name, fileUrl, file.type, file.size);


      setUploadProgress(0);
      fileInputRef.current.value = '';

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        className="hidden"
        disabled={disabled || isUploading}
      />

      <button
        onClick={handleFileSelect}
        disabled={disabled || isUploading}
        className={`p-2 rounded-lg transition-colors ${disabled || isUploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
        title="Upload file (max 5MB)"
      >
        {isUploading ? (
          <div className="flex items-center space-x-1">
            <div className="animate-spin">
              <i className="pi pi-spinner text-sm"></i>
            </div>
            <span className="text-xs">{uploadProgress}%</span>
          </div>
        ) : (
          <i className="pi pi-paperclip text-sm"></i>
        )}
      </button>
      {isUploading && (
        <div className="absolute bottom-full left-0 mb-2 bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          Uploading... {uploadProgress}%
        </div>
      )}
    </div>
  );
}

FileUpload.propTypes = {
  roomId: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  onFileUploaded: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default FileUpload;