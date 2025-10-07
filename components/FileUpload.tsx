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
            ? 'border-black dark:border-white bg-slate-50 dark:bg-slate-900' 
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-black hover:border-black dark:hover:border-white hover:bg-slate-50 dark:hover:bg-slate-900'
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
              <div className="p-3 bg-black dark:bg-white rounded-full mb-3">
                <File className="w-6 h-6 text-white dark:text-black" />
              </div>
              <p className="text-sm font-medium text-black dark:text-white mb-1">
                {file.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={handleRemove}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 text-xs font-medium rounded-md transition-colors"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </>
          ) : (
            <>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 group-hover:bg-black dark:group-hover:bg-white transition-colors">
                <Upload className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-white dark:group-hover:text-black transition-colors" />
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

