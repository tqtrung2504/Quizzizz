import React, { useState } from 'react';

interface TestNotificationProps {
  onClose: () => void;
}

const TestNotification: React.FC<TestNotificationProps> = ({ onClose }) => {
  const [testType, setTestType] = useState<'single' | 'multiple' | 'exam'>('single');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form data cho single notification
  const [singleData, setSingleData] = useState({
    userId: '',
    title: '',
    message: '',
    type: 'test'
  });

  // Form data cho multiple notification
  const [multipleData, setMultipleData] = useState({
    userIds: '',
    title: '',
    message: '',
    type: 'test'
  });

  // Form data cho exam notification
  const [examData, setExamData] = useState({
    examName: '',
    courseName: '',
    studentIds: ''
  });

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(singleData),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: 'Lỗi kết nối: ' + error });
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const userIds = multipleData.userIds.split(',').map(id => id.trim()).filter(id => id);
      
      const response = await fetch('/api/test/notification-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...multipleData,
          userIds
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: 'Lỗi kết nối: ' + error });
    } finally {
      setLoading(false);
    }
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const studentIds = examData.studentIds.split(',').map(id => id.trim()).filter(id => id);
      
      const response = await fetch('/api/test/exam-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...examData,
          studentIds
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: 'Lỗi kết nối: ' + error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Test Notification</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex mb-4 border-b">
          <button
            onClick={() => setTestType('single')}
            className={`px-4 py-2 ${testType === 'single' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          >
            Single User
          </button>
          <button
            onClick={() => setTestType('multiple')}
            className={`px-4 py-2 ${testType === 'multiple' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          >
            Multiple Users
          </button>
          <button
            onClick={() => setTestType('exam')}
            className={`px-4 py-2 ${testType === 'exam' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          >
            Exam Notification
          </button>
        </div>

        {/* Single User Form */}
        {testType === 'single' && (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User ID:</label>
              <input
                type="text"
                value={singleData.userId}
                onChange={(e) => setSingleData({...singleData, userId: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Nhập User ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title:</label>
              <input
                type="text"
                value={singleData.title}
                onChange={(e) => setSingleData({...singleData, title: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Nhập tiêu đề"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message:</label>
              <textarea
                value={singleData.message}
                onChange={(e) => setSingleData({...singleData, message: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Nhập nội dung"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type:</label>
              <input
                type="text"
                value={singleData.type}
                onChange={(e) => setSingleData({...singleData, type: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="test"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi Notification'}
            </button>
          </form>
        )}

        {/* Multiple Users Form */}
        {testType === 'multiple' && (
          <form onSubmit={handleMultipleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User IDs (phân cách bằng dấu phẩy):</label>
              <input
                type="text"
                value={multipleData.userIds}
                onChange={(e) => setMultipleData({...multipleData, userIds: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="user1, user2, user3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title:</label>
              <input
                type="text"
                value={multipleData.title}
                onChange={(e) => setMultipleData({...multipleData, title: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Nhập tiêu đề"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message:</label>
              <textarea
                value={multipleData.message}
                onChange={(e) => setMultipleData({...multipleData, message: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Nhập nội dung"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type:</label>
              <input
                type="text"
                value={multipleData.type}
                onChange={(e) => setMultipleData({...multipleData, type: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="test"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi Notification'}
            </button>
          </form>
        )}

        {/* Exam Notification Form */}
        {testType === 'exam' && (
          <form onSubmit={handleExamSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên bài thi:</label>
              <input
                type="text"
                value={examData.examName}
                onChange={(e) => setExamData({...examData, examName: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Nhập tên bài thi"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên lớp:</label>
              <input
                type="text"
                value={examData.courseName}
                onChange={(e) => setExamData({...examData, courseName: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Nhập tên lớp"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Student IDs (phân cách bằng dấu phẩy):</label>
              <input
                type="text"
                value={examData.studentIds}
                onChange={(e) => setExamData({...examData, studentIds: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="student1, student2, student3"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi Exam Notification'}
            </button>
          </form>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h3 className="font-bold mb-2">Kết quả:</h3>
            <p>{result.message}</p>
            {result.data && (
              <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestNotification; 