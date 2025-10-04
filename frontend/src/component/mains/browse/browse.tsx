// browse.tsx
import React, { useEffect, useRef, useState } from "react";
import "./browse.css"; // Create a corresponding CSS file for styling
import UploadIcon from "assets/icon/ip-upload-icon";

interface BrowseFileProps {
  inputId: string;
  multiple: boolean;
  disabled: boolean;
  reset?: boolean;
  activateFileName?: boolean;
  onFileUpload: (files: FileList | null) => void;
}

const BrowseFile: React.FC<BrowseFileProps> = ({
  inputId,
  multiple,
  disabled,
  reset,
  activateFileName,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSelectedFileName, setIsSelectedFileName] = useState<string[]>([]);

  const handleFileUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const fileLists = Array.from(files);
      const fileNames = fileLists.map((file) => file.name);
      setIsSelectedFileName(fileNames);
      // setIsUploadClicked(false);
      onFileUpload(files);
    } else {
      onFileUpload(null);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    handleFileUpload(files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    handleFileUpload(files);
  };

  const getFileName = (fileName: string) => {
    const [name, extension] = fileName.split(".");
    return name.length > 16 ? `${name.slice(0, 16)}...${extension}` : fileName;
  };

  useEffect(() => {
    if (reset) {
      setIsSelectedFileName([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onFileUpload(null);
    }
  }, [reset]);

  return (
    <div>
      <div
        className="browseBox"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <label
          htmlFor={inputId}
          className={`browseFile ${disabled ? "disabled" : ""}`}
        >
          <UploadIcon
            className={`abbIcon  ${disabled ? "disabled" : ""}`}
            size="large"
          />
          <span>Browse files</span>
        </label>

        <input
          type="file"
          id={inputId}
          accept={".pdf"}
          multiple={multiple}
          disabled={disabled}
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />
      </div>
      <div>
        {activateFileName && isSelectedFileName.length > 0 && (
          <div className="selectedFileName">
            {/* <h3>Selected files:</h3> */}
            {isSelectedFileName.map((fileName, index) => (
              <span key={index}>{getFileName(fileName)}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseFile;
