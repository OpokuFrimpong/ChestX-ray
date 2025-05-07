import React, { useRef, useState } from 'react';
import axios from 'axios';
import './Uploader.css';

const Uploader = () => {
    const inputRef = useRef();
    const [selectedFile, setSelectedFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("select");
    const [analysisResults, setAnalysisResults] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setAnalysisResults(null); // Reset analysis results on new file selection
            
            // Create preview URL
            if (file) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                setUploadStatus("ready");
            }
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
            setIsLoading(true);
            setUploadStatus("uploading");
            const formData = new FormData();
            formData.append("image", selectedFile);

            // Update the URL to your Flask backend
            const response = await axios.post("http://localhost:5000/api/predict", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || selectedFile.size;
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
                    setProgress(percentCompleted);
                },
            });

            setUploadStatus("done");
            
            // Process the API response
            const results = response.data;
            
            // Format the results for display
            const formattedResults = {
                primary: results.detected_conditions.length > 0 ? 
                         "Abnormal - Conditions Detected" : "Normal - No Conditions Detected",
                description: results.detected_conditions.length > 0 ? 
                            `The analysis detected the following conditions: ${results.detected_conditions.join(', ')}` :
                            "No abnormal conditions were detected in this X-ray image.",
                probabilities: Object.entries(results.predictions)
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, probability]) => ({
                        label: label,
                        percentage: Math.round(probability * 100)
                    }))
            };
            
            setAnalysisResults(formattedResults);
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadStatus("error");
            alert("Analysis failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetUpload = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadStatus("select");
        setAnalysisResults(null);
        setProgress(0);
    };

    return (
        <div className="uploader-container">
            <div className="uploader-header">
                <h1 className="uploader-title">Lung X-ray Disease Classifier</h1>
                <p className="uploader-disclaimer">
                    <strong>Important Disclaimer:</strong> This tool is for educational purposes only and does not provide medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment.
                </p>
            </div>
            
            <div className="uploader-content">
                <div className="upload-card">
                    <div className="upload-area-container">
                        <div 
                            className={`upload-area ${previewUrl ? 'has-image' : ''}`} 
                            onClick={!isLoading ? onChooseFile : undefined}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                onChange={handleFileChange}
                                accept="image/jpeg,image/png"
                                style={{ display: "none" }}
                            />
                            
                            {!previewUrl ? (
                                <div className="upload-placeholder">
                                    <div className="upload-icon">
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <h3 className="upload-text">Upload your lung X-ray image</h3>
                                    <p className="upload-subtext">Supported formats: JPEG, PNG</p>
                                </div>
                            ) : (
                                <div className="image-preview">
                                    <img src={previewUrl} alt="X-ray preview" className="preview-image" />
                                    {!isLoading && (
                                        <button className="change-image-btn" onClick={(e) => {
                                            e.stopPropagation();
                                            onChooseFile();
                                        }}>
                                            Change Image
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            {uploadStatus === "uploading" && (
                                <div className="upload-overlay">
                                    <div className="spinner"></div>
                                    <div className="progress-container">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <p className="progress-text">Analyzing... {progress}%</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button
                            className="select-btn"
                            onClick={onChooseFile}
                            disabled={isLoading}
                        >
                            Select Image
                        </button>
                        <button
                            className={`analyze-btn ${!selectedFile || isLoading ? 'disabled' : ''}`}
                            onClick={handleUpload}
                            disabled={!selectedFile || isLoading}
                        >
                            {uploadStatus === "uploading" ? `Analyzing...` : "Analyze Image"}
                        </button>
                    </div>
                </div>

                {analysisResults && (
                    <div className="results-card">
                        <div className="results-header">
                            <h2>Analysis Results</h2>
                            <button className="reset-btn" onClick={resetUpload}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                New Analysis
                            </button>
                        </div>
                        
                        <div className="primary-assessment">
                            <div className="assessment-header">
                                <span className="assessment-label">Primary Assessment</span>
                                <span className={`assessment-value ${analysisResults.primary.toLowerCase().includes('normal') ? 'normal' : 'abnormal'}`}>
                                    {analysisResults.primary}
                                </span>
                            </div>
                            <p className="assessment-description">{analysisResults.description}</p>
                        </div>
                        
                        <div className="probabilities-section">
                            <h3>Condition Probabilities</h3>
                            <div className="probabilities">
                                {analysisResults.probabilities.map((item, index) => (
                                    <div key={index} className="probability-item">
                                        <div className="probability-label">{item.label.replace('_', ' ')}</div>
                                        <div className="probability-bar-container">
                                            <div className="probability-bar">
                                                <div
                                                    className={`probability-fill ${item.percentage > 50 ? 'high' : 'low'}`}
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="probability-percentage">{item.percentage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="results-footer">
                            <p className="results-disclaimer">
                                This analysis is based on machine learning and should not replace professional medical diagnosis.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Uploader;