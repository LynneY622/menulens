import React, { useCallback } from 'react';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (base64: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onFileSelect(base64String);
      };
      reader.readAsDataURL(file);
    }
  }, [onFileSelect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">MenuLens 🥢</h1>
        <p className="text-gray-500">Snap a photo, understand the food.</p>
      </div>

      <div className="w-full max-w-md grid grid-cols-1 gap-4">
        {/* Camera Input */}
        <label className="relative flex items-center justify-center w-full p-8 border-2 border-dashed border-blue-400 rounded-2xl bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors group">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center space-y-2">
            <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform text-blue-500">
              <Camera size={32} />
            </div>
            <span className="font-semibold text-blue-700">Take a Photo</span>
          </div>
        </label>

        {/* Gallery Input */}
        <label className="relative flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-white cursor-pointer hover:bg-gray-50 transition-colors group">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-row items-center space-x-3 text-gray-500 group-hover:text-gray-700">
            <ImageIcon size={24} />
            <span className="font-medium">Upload from Gallery</span>
          </div>
        </label>
      </div>
      
      <p className="text-xs text-gray-400 max-w-xs text-center">
        Supported formats: JPEG, PNG, WEBP. <br/> Use clear lighting for best results.
      </p>
    </div>
  );
};

export default FileUpload;