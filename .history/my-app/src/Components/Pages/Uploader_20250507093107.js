import React, { useState, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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

    // Add this function inside your Uploader component
    const downloadResultsAsPDF = () => {
        if (!analysisResults) return;
        
        const doc = new jsPDF();
        
        // Add title and header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text('Lung X-Ray Analysis Report', 105, 20, { align: 'center' });
        
        // Add date and time
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
        
        // Add disclaimer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('DISCLAIMER: This analysis is for educational purposes only and should not replace professional medical advice.', 
                 105, 35, { align: 'center' });
        
        // Add primary assessment
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Primary Assessment:', 20, 50);
        
        doc.setFontSize(16);
        const primaryColor = analysisResults.primary.toLowerCase() === 'normal' ? [0, 128, 0] : [220, 20, 60];
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`${analysisResults.primary} (${analysisResults.confidence}% confidence)`, 70, 50);
        
        // Add description
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text('Assessment Description:', 20, 60);
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        
        // Handle multi-line description
        const splitDescription = doc.splitTextToSize(analysisResults.description, 170);
        doc.text(splitDescription, 20, 70);
        
        // Add probability table
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        const yPos = 70 + splitDescription.length * 7;
        doc.text('Detected Conditions:', 20, yPos);
        
        // Create table data
        const tableColumn = ["Condition", "Probability"];
        const tableRows = [];
        
        analysisResults.probabilities.forEach(item => {
            tableRows.push([item.label, `${item.percentage}%`]);
        });
        
        // Add the table
        doc.autoTable({
            startY: yPos + 5,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [70, 70, 70] },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 40, halign: 'center' }
            }
        });
        
        // Add image if available
        if (previewUrl) {
            doc.addPage();
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text('Analyzed X-Ray Image:', 105, 20, { align: 'center' });
            
            // Add the image (this requires the image to be added to the PDF)
            const img = new Image();
            img.src = previewUrl;
            doc.addImage(img, 'PNG', 35, 30, 140, 140);
        }
        
        // Save the PDF
        doc.save('lung-xray-analysis.pdf');
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
                            <button onClick={downloadResultsAsText} className="download-btn pdf-btn">
                                <span className="download-icon">📄</span>
                                Download Report
                            </button>
                            <button onClick={downloadResultsAsCSV} className="download-btn csv-btn">
                                <span className="download-icon">📊</span>
                                Download CSV
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
                            <h3>High Confidence Findings (≥85%):</h3>
                            <div className="probability-list">
                                {analysisResults.probabilities && 
                                 analysisResults.probabilities.filter(item => item.percentage >= 85).length > 0 ? (
                                    analysisResults.probabilities
                                        .filter(item => item.percentage >= 85)
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
                                    <p className="no-high-prob">No conditions detected with high confidence (≥85%)</p>
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