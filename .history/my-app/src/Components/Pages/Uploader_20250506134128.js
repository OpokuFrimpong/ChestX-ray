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
            
            // Test with hardcoded data to match the desired layout
            // Comment out for production use with actual API data
            const mockResults = {
                primary: "Normal",
                confidence: 82,
                description: "No signs of lung disease detected.",
                probabilities: [
                    { label: "Normal", percentage: 82 },
                    { label: "Pneumonia", percentage: 12 },
                    { label: "Tuberculosis", percentage: 4 },
                    { label: "COVID-19", percentage: 2 }
                ]
            };
            setAnalysisResults(mockResults);
            
            /* Uncomment for production use
            // Process the API response
            const results = response.data;
            
            // Check if the response has the expected structure
            if (!results) {
                throw new Error("Empty response from server");
            }
            
            // Format results to match the desired layout
            const formattedResults = {
                primary: results.primary || "Normal",
                confidence: 82, // Replace with actual confidence from API if available
                description: results.description || "No signs of lung disease detected.",
                probabilities: []
            };
            
            // Process the probabilities
            if (results.predictions && typeof results.predictions === 'object') {
                formattedResults.probabilities = Object.entries(results.predictions)
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, probability]) => ({
                        label: label,
                        percentage: Math.round(probability * 100)
                    }));
            }
            
            console.log("Formatted results:", formattedResults);
            setAnalysisResults(formattedResults);
            */
            
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