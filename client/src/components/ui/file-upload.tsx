import { useEffect, useState } from "react";
import { Cloud, File, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "./button";
import { FileWithPreview } from "@/types";

interface FileUploadProps {
  value?: FileWithPreview | null;
  onChange: (file: FileWithPreview | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
}

export function FileUpload({
  value,
  onChange,
  onBlur,
  disabled = false,
  accept = {
    'image/*': []
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  className = "",
}: FileUploadProps) {
  const [file, setFile] = useState<FileWithPreview | null>(value || null);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.[0]) {
        const file = Object.assign(acceptedFiles[0], {
          preview: URL.createObjectURL(acceptedFiles[0])
        });
        setFile(file);
        onChange(file);
      }
    },
    maxSize,
    accept,
    disabled,
    maxFiles: 1,
  });

  // Handle file removal
  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setFile(null);
    onChange(null);
  };

  // Show file rejection errors
  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <div key={file.name} className="mt-1 text-sm text-red-500">
      {errors.map(e => (
        <p key={e.code}>{e.message}</p>
      ))}
    </div>
  ));

  // Create preview when file value changes
  useEffect(() => {
    if (value && !(value instanceof File)) {
      // If value is a string (URL), create a placeholder preview object
      const mockFile = {
        name: value.name || "Uploaded Image",
        size: 0,
        type: "image/jpeg",
        preview: value.preview,
      } as FileWithPreview;
      setFile(mockFile);
    } else {
      setFile(value || null);
    }
  }, [value]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (file?.preview && file instanceof File) {
        URL.revokeObjectURL(file.preview);
      }
    };
  }, [file]);

  return (
    <div className={className}>
      <div
        {...getRootProps({
          className: `border-2 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 ${
            isDragActive ? "border-primary-300 bg-primary-50" : "border-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`,
          onBlur,
        })}
      >
        <input {...getInputProps()} />
        
        {file ? (
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {file.type?.startsWith("image/") && file.preview ? (
                <div className="h-16 w-16 relative">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-16 w-16 object-cover rounded-md"
                    onLoad={() => {
                      if (file instanceof File) {
                        URL.revokeObjectURL(file.preview);
                      }
                    }}
                  />
                </div>
              ) : (
                <File className="h-8 w-8 text-gray-500" />
              )}
              <div className="text-xs text-gray-700">
                <p className="font-medium">{file.name}</p>
                {file.size && (
                  <p>{Math.round(file.size / 1024)}kb</p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="opacity-70 hover:opacity-100"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <Cloud className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? "Drop the file here" : "Drag and drop a file here or click to browse"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max file size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {fileRejectionItems}
    </div>
  );
}
