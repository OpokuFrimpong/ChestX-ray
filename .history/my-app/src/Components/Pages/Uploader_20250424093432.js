import React, { useRef, useState } from 'react';
//
import axios from 'axios';
import './Uploader.css';

const Uploader = () => {
    const inputRef = useRef();
    const [selectedFile, setSelectedFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("select");
    const [analysisResults, setAnalysisResults] = useState(null);

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setAnalysisResults(null); // Reset analysis results on new file selection
        }
    };

    const onChooseFile = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setUploadStatus("uploading");
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await axios.post("http://localhost:8000/api/analyze", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || selectedFile.size;
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
                    setProgress(percentCompleted);
                },
            });

            setUploadStatus("done");
            setAnalysisResults(response.data); // Assume the server returns analysis results
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadStatus("select");
        }
    };

    return (
        <div className="uploader-container">
            <h1 className="uploader-title">Lung X-ray Disease Classifier</h1>
            <p className="uploader-disclaimer">
                <strong>Important Disclaimer:</strong> This tool is for educational purposes only and does not provide medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment.
            </p>
            
            <div className="upload-section">
                <div className="file-btn" onClick={onChooseFile}>
                    <input
                        ref={inputRef}
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />
                    <span className="material-symbols-outlined"></span>
                    <p>Upload your lung X-ray image</p>
                    <p className="file-formats">Supported formats: JPEG, PNG</p>
                </div>
                <div className="action-buttons">
                    <button
                        className="select-btn"
                        onClick={onChooseFile}
                        disabled={!!selectedFile}
                    >
                        Select Image
                    </button>
                    <button
                        className="analyze-btn"
                        onClick={handleUpload}
                        disabled={!selectedFile || uploadStatus === "uploading"}
                    >
                        {uploadStatus === "uploading" ? `Uploading... ${progress}%` : "Analyze Image"}
                    </button>
                </div>
            </div>
            {analysisResults && (
                <div className="analysis-results">
                    <h3>Analysis Results</h3>
                    <div className="primary-assessment">
                        <p>Primary Assessment: <strong>{analysisResults.primary}</strong></p>
                        <p>{analysisResults.description}</p>
                    </div>
                    <div className="probabilities">
                        {analysisResults.probabilities.map((item, index) => (
                            <div key={index} className="probability-item">
                                <span>{item.label}</span>
                                <div className="progress-bar">
                                    <div
                                        className="progress"
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                                <span>{item.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Uploader;