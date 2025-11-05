"use client";

import React, { ReactHTMLElement, useState } from "react";

const DragAndDrop = ({ onVideoSelect }: any) => {
  // State to track if the user is dragging a file over the component
  const [isDragging, setIsDragging] = useState(false);

  // Event handler for dragenter and dragover
  const handleDragOver = (e: any) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Event handler for dragleave
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Event handler for drop
  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);

    // Get the dropped files
    const files = e.dataTransfer.files;

    // Check if there are files and if the first file is a video file
    if (files && files.length > 0 && files[0].type.startsWith("video/")) {
      // Call the onVideoSelect callback with the video file
      onVideoSelect(files[0]);
    }
  };

  // Dynamic styling for the component
  const dropAreaStyle = isDragging
    ? "border-[1px] border-dashed border-base2 rounded-md"
    : "border-[1px] border-dashed border-placeholderText rounded-md";

  return (
    <div
      className={`md:w-1/2 w-full px-4 h-[5rem] flex items-center justify-center text-center ${dropAreaStyle}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      id="video-upload"
    >
      {/* Conditional rendering based on dragging state */}
      {isDragging ? (
        <p className="text-base text-[0.70rem]">Drop the video here...</p>
      ) : (
        <p className="text-gray-500 text-[0.70rem]">
          Drag and drop file <span className="text-tertiary">here </span>
        </p>
      )}
    </div>
  );
};

export default DragAndDrop;
