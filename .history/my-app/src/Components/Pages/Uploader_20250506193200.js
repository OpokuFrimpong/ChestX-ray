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

            // Add a timeout to the request
            const response = await axios.post("http://localhost:5000/api/predict", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || selectedFile.size;
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
                    setProgress(percentCompleted);
                },
                timeout: 30000 // 30 seconds timeout
            });

            console.log("Backend response:", response.data);
            setUploadStatus("done");
            
            // Process the API response
            const results = response.data;
            
            if (!results) {
                throw new Error("Empty response from server");
            }
            
            // Format the results for display
            const formattedResults = {
                primary: "Analysis Complete",
                confidence: 0,
                description: "Analysis completed successfully.",
                probabilities: []
            };
            
            // Update data based on response
            if (results.primary) {
                formattedResults.primary = results.primary;
            }
            
            if (results.confidence) {
                formattedResults.confidence = results.confidence;
            }
            
            if (results.description) {
                formattedResults.description = results.description;
            }
            
            // Process predictions if available
            if (results.predictions) {
                formattedResults.probabilities = Object.entries(results.predictions)
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, probability]) => ({
                        label: label,
                        percentage: Math.round(probability * 100)
                    }));
            }
            
            console.log("Formatted results:", formattedResults);
            setAnalysisResults(formattedResults);
            
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadStatus("error");
            
            // Provide more detailed error information
            let errorMessage = "Please try again";
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                errorMessage = `Server error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`;
                console.error("Error response:", error.response);
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = "No response from server. Check if the server is running.";
                console.error("Error request:", error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                errorMessage = error.message;
            }
            
            alert(`Analysis failed: ${errorMessage}`);
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
                                {analysisResults.probabilities && analysisResults.probabilities.length > 0 ? (
                                    analysisResults.probabilities.map((item, index) => (
                                        <div key={index} className="probability-item">
                                            <div className="probability-label">{item.label}</div>
                                            <div className="probability-bar-wrapper">
                                                <div className={`probability-bar ${item.label.toLowerCase() === "normal" ? "normal-bar" : "condition-bar-" + (index % 5)}`}
                                                     style={{ width: `${item.percentage}%` }}>
                                                </div>
                                            </div>
                                            <div className="probability-value">{item.percentage}%</div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No probability data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Uploader;