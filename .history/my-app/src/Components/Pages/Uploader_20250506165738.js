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

            console.log("Sending request to backend with file:", selectedFile.name);

            // Connect to your real Flask backend
            const response = await axios.post("http://localhost:5000/api/predict", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || selectedFile.size;
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
                    setProgress(percentCompleted);
                },
            });

            console.log("Backend response:", response.data);
            setUploadStatus("done");
            
            // Process the actual API response - NO MOCK DATA
            const results = response.data;
            
            if (!results) {
                throw new Error("Empty response from server");
            }
            
            // Format real backend results to match your UI
            const formattedResults = {
                primary: "Normal", // Default
                confidence: 0,
                description: "No analysis results available.",
                probabilities: []
            };
            
            // If backend provides a primary assessment directly
            if (results.primary) {
                formattedResults.primary = results.primary;
            } 
            // Otherwise infer from detected conditions
            else if (results.hasOwnProperty('detected_conditions')) {
                formattedResults.primary = results.detected_conditions.length > 0 ? 
                    "Abnormal" : "Normal";
            }
            
            // Get description from backend or create based on detected conditions
            if (results.description) {
                formattedResults.description = results.description;
            } else if (results.hasOwnProperty('detected_conditions')) {
                formattedResults.description = results.detected_conditions.length > 0 ? 
                    `Signs of lung disease detected: ${results.detected_conditions.join(', ')}` : 
                    "No signs of lung disease detected.";
            }
            
            // Get confidence from backend or use highest probability value
            if (results.confidence) {
                formattedResults.confidence = results.confidence;
            } else if (results.predictions) {
                // Find highest probability and use as confidence
                const highestProb = Math.max(...Object.values(results.predictions));
                formattedResults.confidence = Math.round(highestProb * 100);
            }
            
            // Process probability data for the UI
            if (results.predictions && typeof results.predictions === 'object') {
                // If backend returns predictions as {label: probability} format
                formattedResults.probabilities = Object.entries(results.predictions)
                    .sort((a, b) => b[1] - a[1]) // Sort by probability (highest first)
                    .map(([label, probability]) => ({
                        label: label.replace('_', ' '),
                        percentage: Math.round(probability * 100)
                    }));
            }
            
            console.log("Formatted results:", formattedResults);
            setAnalysisResults(formattedResults);
            
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadStatus("error");
            alert(`Analysis failed: ${error.message || "Please try again"}`);
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
        <div className="lung-analyzer-container">
            <div className="analyzer-left-panel">
                <div className="disclaimer-banner">
                    <p><strong>Important Disclaimer:</strong> This tool is for educational purposes only and does not provide medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment.</p>
                </div>
                
                <div className="image-upload-container">
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
                        
                        {previewUrl ? (
                            <div className="x-ray-preview">
                                <img src={previewUrl} alt="X-ray preview" />
                                {!isLoading && (
                                    <button className="change-image-btn" onClick={onChooseFile}>
                                        Change Image
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="upload-placeholder">
                                <p>Upload your lung X-ray image</p>
                            </div>
                        )}
                        
                        {uploadStatus === "uploading" && (
                            <div className="upload-overlay">
                                <div className="spinner"></div>
                                <p>Analyzing... {progress}%</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="button-container">
                        <button className="select-btn" onClick={onChooseFile} disabled={isLoading}>
                            Select Image
                        </button>
                        <button 
                            className="analyze-btn" 
                            onClick={handleUpload} 
                            disabled={!selectedFile || isLoading}
                        >
                            Analyze Image
                        </button>
                    </div>
                </div>
            </div>
            
            {analysisResults && (
                <div className="analyzer-right-panel">
                    <div className="results-card">
                        <h2>Analysis Results</h2>
                        
                        <div className="primary-assessment">
                            <div className="assessment-header">
                                <span>Primary Assessment:</span>
                                <span className={analysisResults.primary.toLowerCase() === "normal" ? "normal-result" : "abnormal-result"}>
                                    {analysisResults.primary}
                                </span>
                                <span className="confidence">{analysisResults.confidence}%</span>
                            </div>
                            <p className="assessment-description">{analysisResults.description}</p>
                        </div>
                        
                        <div className="all-probabilities">
                            <h3>All Probabilities:</h3>
                            <div className="probability-list">
                                {analysisResults.probabilities.map((item, index) => (
                                    <div key={index} className="probability-item">
                                        <div className="probability-label">{item.label}</div>
                                        <div className="probability-bar-wrapper">
                                            <div className={`probability-bar ${item.label.toLowerCase() === "normal" ? "normal-bar" : "condition-bar-" + index}`}
                                                 style={{ width: `${item.percentage}%` }}>
                                            </div>
                                        </div>
                                        <div className="probability-value">{item.percentage}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Uploader;