'use client';

import { useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { CarrierType } from '@/app/page';

interface FileUploadProps {
  carrier: CarrierType;
  label: string;
  onFileChange: (carrier: CarrierType, file: File | null) => void;
  file: File | null;
}

export default function FileUpload({ carrier, label, onFileChange, file }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(carrier, selectedFile);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(carrier, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="group">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      <div
        onClick={handleClick}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-6
          transition-all duration-300 ease-in-out
          ${file
            ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
          }
          group-hover:scale-[1.02] group-hover:shadow-lg
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center">
          {file ? (
            <>
              <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full mb-3">
                <File className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                {file.name}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={handleRemove}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </>
          ) : (
            <>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <Upload className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Click to upload
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                CSV or Excel file
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

