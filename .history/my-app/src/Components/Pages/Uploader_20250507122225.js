import React, { useState, useRef } from 'react';
import axios from 'axios';
//import { jsPDF } from 'jspdf';
//import 'jspdf-autotable';
import './Uploader.css';

const Uploader = () => {
    const inputRef = useRef();
    const [selectedFile, setSelectedFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState("select");
    const [analysisResults, setAnalysisResults] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showAllProbabilities, setShowAllProbabilities] = useState(false);
    const [showPrintView, setShowPrintView] = useState(false);

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
                // Create an array of condition objects with their probabilities
                formattedResults.probabilities = Object.entries(results.predictions)
                    .map(([label, probability]) => ({
                        label: label.charAt(0).toUpperCase() + label.slice(1), // Capitalize label
                        percentage: Math.round(probability * 100)
                    }))
                    .sort((a, b) => b.percentage - a.percentage); // Sort by percentage in descending order
                
                // Filter out very low probability conditions (optional)
                formattedResults.probabilities = formattedResults.probabilities
                    .filter(item => item.percentage > 1); // Only show conditions with > 1% probability
            }

            // If detected_conditions exist, log them
            if (results.detected_conditions) {
                console.log("Detected conditions:", results.detected_conditions);
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

    // Add a simple CSV download option too
    const downloadResultsAsCSV = () => {
        if (!analysisResults) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Condition,Probability\n";
        
        analysisResults.probabilities.forEach(item => {
            csvContent += `${item.label},${item.percentage}%\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lung-xray-analysis.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Replace the PDF download function with this simpler text download
    const downloadResultsAsText = () => {
        if (!analysisResults) return;
        
        // Format the results as text
        let content = "Lung X-Ray Analysis Results\n\n";
        content += `Date: ${new Date().toLocaleString()}\n\n`;
        content += `Primary Assessment: ${analysisResults.primary} (${analysisResults.confidence}%)\n`;
        content += `Description: ${analysisResults.description}\n\n`;
        content += "Probabilities:\n";
        
        // Add all probabilities
        analysisResults.probabilities.forEach(item => {
            content += `${item.label}: ${item.percentage}%\n`;
        });
        
        // Create a Blob with the text content
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create a link and trigger the download
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "lung-xray-analysis.txt");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Add this simple function to toggle the print view
    const togglePrintView = () => setShowPrintView(!showPrintView);

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
                        
                        {/* Position download buttons right under the heading */}
                        <div className="download-options">
                            <button onClick={togglePrintView} className="download-btn pdf-btn">
                                <span className="download-icon"></span>
                                Preview Report
                            </button>
                            <button onClick={downloadResultsAsText} className="download-btn csv-btn">
                                <span className="download-icon"></span>
                                Download Report
                            </button>
                        </div>
                        
                        {/* Rest of your results display */}
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
                        
                        {/* Only show high confidence findings */}
                        <div className="all-probabilities">
                            <h3>Detected Conditions:</h3>
                            <div className="probability-list">
                                {results.detected_conditions && 
                                 results.detected_conditions.length > 0 ? (
                                    // Map the detected_conditions from the backend
                                    analysisResults.probabilities
                                        .filter(item => 
                                            // Only show items that are in the detected_conditions array
                                            results.detected_conditions.includes(item.label) || 
                                            results.detected_conditions.includes(item.label.toLowerCase())
                                        )
                                        .map((item, index) => (
                                            <div key={index} className="probability-item high-probability">
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
                                    <p className="no-high-prob">No conditions detected</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add this at the bottom of your component */}
            {showPrintView && (
                <div className="print-overlay">
                    <div className="print-report">
                        <div className="print-header">
                            <h2>Lung X-Ray Analysis Report</h2>
                            <button onClick={togglePrintView} className="close-print">×</button>
                        </div>
                        <div className="print-date">Generated on: {new Date().toLocaleString()}</div>
                        
                        <div className="print-assessment">
                            <h3>Primary Assessment:</h3>
                            <div className={`print-result ${analysisResults.primary.toLowerCase() === "normal" ? "print-normal" : "print-abnormal"}`}>
                                {analysisResults.primary} ({analysisResults.confidence}%)
                            </div>
                            <p>{analysisResults.description}</p>
                        </div>
                        
                        <div className="print-probabilities">
                            <h3>Detected Conditions:</h3>
                            <table className="print-table">
                                <thead>
                                    <tr>
                                        <th>Condition</th>
                                        <th>Probability</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysisResults.probabilities.map((item, index) => (
                                        <tr key={index} className={item.percentage >= 85 ? "high-prob-row" : ""}>
                                            <td>{item.label}</td>
                                            <td>{item.percentage}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="print-footer">
                            <p>DISCLAIMER: This analysis is for educational purposes only and should not replace professional medical advice.</p>
                            <button onClick={() => window.print()} className="print-button">Print this Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Uploader;