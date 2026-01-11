import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { createQuestion, Question } from './QuestionApi';

interface Props {
  bankId: string;
  onSuccess?: (questionsFromExcel: any) => void;
  onClose: () => void;
}

const excelSample = [
  ['Nội dung câu hỏi', 'Loại', 'Độ khó', 'Đáp án 1', 'Đúng 1', 'Đáp án 2', 'Đúng 2', 'Đáp án 3', 'Đúng 3', 'Đáp án 4', 'Đúng 4'],
  ['Câu hỏi mẫu', 'single', 'easy', 'Đáp án A', 'TRUE', 'Đáp án B', 'FALSE', 'Đáp án C', 'FALSE', 'Đáp án D', 'FALSE']
];

const ImportQuestionExcel: React.FC<Props> = ({ bankId, onSuccess, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<Question[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        setSelectedFile(file);
        processFile(file);
      } else {
        setError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      }
    }
  };

  const processFile = async (file: File) => {
    try {
      setError('');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (rows.length < 2) {
        setError('File Excel phải có ít nhất 1 câu hỏi (không tính header)');
        return;
      }

      // Bỏ header
      const questions: Question[] = rows.slice(1).map((row, index) => {
        const [content, type, level, ...rest] = row;
        const options: { text: string; correct: boolean }[] = [];
        
        for (let i = 0; i < rest.length; i += 2) {
          if (rest[i]) {
            options.push({ 
              text: rest[i], 
              correct: String(rest[i + 1]).toLowerCase() === 'true' 
            });
          }
        }

        if (!content) {
          throw new Error(`Câu hỏi thứ ${index + 1}: Thiếu nội dung câu hỏi`);
        }

        if (options.length < 2) {
          throw new Error(`Câu hỏi thứ ${index + 1}: Phải có ít nhất 2 đáp án`);
        }

        const correctCount = options.filter(opt => opt.correct).length;
        if (correctCount === 0) {
          throw new Error(`Câu hỏi thứ ${index + 1}: Phải có ít nhất 1 đáp án đúng`);
        }

        return {
          questionBankId: bankId,
          bankId: bankId,
          content: content || '',
          type: (type || 'single') as any,
          level: (level || 'easy') as any,
          options
        };
      });

      setParsed(questions);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi đọc file Excel');
      setParsed([]);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    processFile(file);
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    
    try {
      for (const q of parsed) {
        await createQuestion(bankId, q);
      }
      onSuccess && onSuccess(parsed);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi import câu hỏi:', err);
      setError('Lỗi khi import câu hỏi: ' + (err.message || 'Không thể kết nối đến server'));
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setParsed([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Import câu hỏi từ Excel</h2>
          <button 
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold" 
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!selectedFile ? (
              <div>
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Kéo thả file Excel vào đây
                </h3>
                <p className="text-gray-500 mb-4">hoặc</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Chọn file Excel
                </button>
                <p className="text-sm text-gray-400 mt-2">
                  Hỗ trợ file .xlsx, .xls
                </p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  File đã được chọn
                </h3>
                <p className="text-gray-600 mb-3">{selectedFile.name}</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                  >
                    Chọn file khác
                  </button>
                  <button
                    onClick={clearFile}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Xóa file
                  </button>
                </div>
              </div>
            )}
          </div>
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            ref={fileInputRef} 
            onChange={handleFile} 
            className="hidden" 
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Excel Template */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Bảng mẫu Excel:</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {excelSample[0].map((header, i) => (
                    <th key={i} className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 text-left">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  {excelSample[1].map((cell, j) => (
                    <td key={j} className="border border-gray-300 px-3 py-2 text-sm text-gray-600">
                      {cell}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            <p><strong>Lưu ý:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Loại: "single" (chọn 1) hoặc "multiple" (chọn nhiều)</li>
              <li>Độ khó: "easy", "medium", "hard"</li>
              <li>Đúng: "TRUE" hoặc "FALSE" (viết hoa)</li>
            </ul>
          </div>
        </div>

        {/* Preview Data */}
        {parsed.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              👀 Xem trước dữ liệu ({parsed.length} câu hỏi):
            </h3>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Tổng câu hỏi: {parsed.length} | 
                  Single: {parsed.filter(q => q.type === 'single').length} | 
                  Multiple: {parsed.filter(q => q.type === 'multiple').length}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {parsed.map((q, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-3 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 mb-1">
                          {idx + 1}. {q.content}
                        </p>
                        <div className="flex gap-2 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            q.type === 'single' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {q.type}
                          </span>
                          <span className={`px-2 py-1 rounded ${
                            q.level === 'easy' ? 'bg-green-100 text-green-800' :
                            q.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {q.level}
                          </span>
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
                            {q.options.length} đáp án
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium" 
            onClick={onClose}
          >
            Hủy
          </button>
          <button 
            type="button" 
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading || parsed.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleImport} 
            disabled={loading || parsed.length === 0}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang import...
              </span>
            ) : (
              `Import ${parsed.length} câu hỏi`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportQuestionExcel; 