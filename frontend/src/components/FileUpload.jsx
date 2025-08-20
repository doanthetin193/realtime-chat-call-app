import { useState } from 'react';

const FileUpload = ({ onFileSelect, onCancel }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                onFileSelect({
                    type: 'file',
                    fileName: selectedFile.name,
                    fileUrl: data.fileUrl,
                    fileSize: selectedFile.size,
                    mimeType: selectedFile.type
                });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('File upload failed');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('doc')) return '📝';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
        return '📎';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Upload File</h3>
                
                <div className="mb-4">
                    <input
                        type="file"
                        onChange={handleFileSelect}
                        className="w-full p-2 border border-gray-300 rounded"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                </div>

                {selectedFile && (
                    <div className="mb-4 p-3 border border-gray-200 rounded">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">
                                {getFileIcon(selectedFile.type)}
                            </span>
                            <div className="flex-1">
                                <div className="font-medium text-sm">
                                    {selectedFile.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {formatFileSize(selectedFile.size)}
                                </div>
                            </div>
                        </div>
                        
                        {preview && (
                            <img
                                src={preview}
                                alt="Preview"
                                className="mt-3 max-w-full h-32 object-cover rounded"
                            />
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// File message component for displaying files in chat
export const FileMessage = ({ message }) => {
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith('image/')) return '🖼️';
        if (mimeType?.startsWith('video/')) return '🎥';
        if (mimeType?.startsWith('audio/')) return '🎵';
        if (mimeType?.includes('pdf')) return '📄';
        if (mimeType?.includes('doc')) return '📝';
        if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return '📊';
        return '📎';
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = message.fileUrl;
        link.download = message.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (message.mimeType?.startsWith('image/')) {
        return (
            <div className="max-w-xs">
                <img
                    src={message.fileUrl}
                    alt={message.fileName}
                    className="rounded cursor-pointer hover:opacity-90"
                    onClick={handleDownload}
                />
                <div className="text-xs text-gray-500 mt-1">
                    {message.fileName} • {formatFileSize(message.fileSize)}
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={handleDownload}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 max-w-xs"
        >
            <span className="text-2xl">
                {getFileIcon(message.mimeType)}
            </span>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                    {message.fileName}
                </div>
                <div className="text-xs text-gray-500">
                    {formatFileSize(message.fileSize)}
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
