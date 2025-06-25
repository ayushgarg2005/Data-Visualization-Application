import React, { useState } from "react";
import axios from "axios";
import { FiUploadCloud, FiLoader } from "react-icons/fi";

const UploadForm = ({ onProcessed }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      const res = await axios.post("http://127.0.0.1:5000/process", formData);
      onProcessed(res.data, file.name);
    } catch (err) {
      alert("⚠️ Error uploading file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      className="w-full flex flex-col sm:flex-row items-center gap-4"
    >
      {/* File input box */}
      <label className="flex-1 relative cursor-pointer group bg-white/70 backdrop-blur border border-dashed border-gray-300 rounded-xl px-5 py-3 transition hover:border-blue-500 hover:bg-blue-50 shadow-sm">
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <div className="flex items-center gap-2 text-gray-700 text-sm">
          <FiUploadCloud className="text-blue-600" />
          {file ? (
            <span className="truncate max-w-xs">{file.name}</span>
          ) : (
            <span>Select CSV File</span>
          )}
        </div>
      </label>

      {/* Upload button */}
      <button
        type="submit"
        disabled={!file || isUploading}
        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all duration-200 shadow-md ${
          isUploading || !file
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isUploading ? (
          <>
            <FiLoader className="animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <FiUploadCloud />
            Upload
          </>
        )}
      </button>
    </form>
  );
};

export default UploadForm;
