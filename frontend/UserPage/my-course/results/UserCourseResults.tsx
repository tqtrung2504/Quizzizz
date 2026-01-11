import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../../../shared/firebase-config';
import { useSearchParams } from 'react-router-dom';
import { getCourseById } from '../../../AdminPage/manage-course/courseApi';

const UserCourseResults: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [results, setResults] = useState<any[]>([]);
  const [showDetail, setShowDetail] = useState<any | null>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [user, setUser] = useState(() => auth.currentUser);
  const [searchParams] = useSearchParams();
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId)
        .then(course => {
          setCourseName(course.name);
          setCourseCode(course.code);
        })
        .catch(() => {
          setCourseName('');
          setCourseCode('');
        });
    }
  }, [courseId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const res = await axios.get('/api/exam-results');
      const partRes = await axios.get('/api/parts');
      setParts(partRes.data);
      // Lọc kết quả của user theo userEmail - hiển thị TẤT CẢ bài thi
      const myResults = res.data.filter((r: any) => {
        return r.userEmail === user?.email;
      });
      setResults(myResults);
      setFilteredResults(myResults);
    };
    fetchData();
  }, [courseId, user]);

  // Kiểm tra testId từ URL params
  useEffect(() => {
    const testId = searchParams.get('testId');
    if (testId) {
      setSelectedTestId(testId);
      const filtered = results.filter((r: any) => r.testId === testId);
      setFilteredResults(filtered);
    } else {
      setFilteredResults(results);
    }
  }, [searchParams, results]);

  const getPart = (partId: string) => parts.find((p: any) => p.id === partId);

  const handleFilterChange = (testId: string) => {
    setSelectedTestId(testId);
    if (testId === '') {
      setFilteredResults(results);
    } else {
      const filtered = results.filter((r: any) => r.testId === testId);
      setFilteredResults(filtered);
    }
  };

  const getUniqueTests = () => {
    const testIds = [...new Set(results.map((r: any) => r.testId))];
    return testIds.map(testId => ({
      id: testId,
      name: getPart(testId)?.name || 'Bài thi không xác định'
    }));
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center">
        <div className="inline-block bg-white rounded-xl shadow-md p-8 border border-slate-200">
          <div className="text-2xl font-bold text-slate-700 mb-2">Bạn cần đăng nhập để xem kết quả.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {(courseName || courseCode) && (
            <span className="text-lg font-bold text-sky-700 bg-sky-50 px-4 py-2 rounded-xl shadow-sm border border-sky-100 mr-4">
              {courseName}
              {courseCode && (
                <span className="text-slate-500 font-normal ml-2">(Mã: <span className="font-mono">{courseCode}</span>)</span>
              )}
            </span>
          )}
          <h2 className="text-3xl font-bold text-slate-800">Kết quả bài thi</h2>
        </div>
        <div className="text-sm text-slate-600">
          Tổng cộng: {filteredResults.length} kết quả
        </div>
      </div>

      {/* Filter */}
      {results.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Lọc theo bài thi:
          </label>
          <select
            value={selectedTestId}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="">Tất cả bài thi</option>
            {getUniqueTests().map(test => (
              <option key={test.id} value={test.id}>{test.name}</option>
            ))}
          </select>
        </div>
      )}

      {filteredResults.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Chưa có kết quả</h3>
          <p className="text-slate-500">
            {results.length === 0 ? 'Bạn chưa có kết quả bài thi nào.' : 'Không có kết quả cho bài thi đã chọn.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {filteredResults.map((r, idx) => {
            const part = getPart(r.testId);
            const correctCount = r.details.filter((d: any) => d.correct).length;
            const incorrectCount = r.details.filter((d: any) => !d.correct).length;
            const totalScore = part?.score || r.details.length;
            return (
              <div key={idx} className="bg-white rounded-xl shadow-md p-4 sm:p-6 cursor-pointer hover:shadow-lg border border-slate-200 transition-shadow flex flex-col min-h-[200px]" onClick={() => setShowDetail({ result: r, part })}>
                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-2 sm:gap-0">
                  <div className="flex-1">
                    <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-1">{r.testName || part?.name || 'Bài thi'}</h3>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Nộp lúc: {new Date(r.submittedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${r.score >= totalScore * 0.5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {r.score >= totalScore * 0.5 ? 'Đạt' : 'Không đạt'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{r.score.toFixed(1)}</div>
                    <div className="text-xs text-slate-500">Điểm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{correctCount}</div>
                    <div className="text-xs text-slate-500">Câu đúng</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-red-600">{incorrectCount}</div>
                    <div className="text-xs text-slate-500">Câu sai</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-slate-600">
                    Tổng điểm: <span className="font-semibold">{r.score.toFixed(1)}/{totalScore}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-0">
          <div className="bg-white rounded-xl shadow p-3 sm:p-8 w-full max-w-xs sm:max-w-md md:max-w-2xl text-left relative overflow-y-auto max-h-[90vh]">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-2xl font-bold" onClick={() => setShowDetail(null)}>&times;</button>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Chi tiết kết quả</h2>
            <div className="mb-2 font-semibold text-sm sm:text-base">{showDetail.result.testName || showDetail.part?.name || 'Bài thi'}</div>
            <div className="mb-2 text-sm sm:text-base">Điểm: <span className="font-bold text-green-600">{showDetail.result.score}</span> / {showDetail.part?.score || showDetail.result.score}</div>
            <div className="mb-2 text-sm sm:text-base">Số câu đúng: <span className="font-bold">{showDetail.result.details.filter((d: any) => d.correct).length}</span></div>
            <div className="mb-2 text-sm sm:text-base">Số câu sai: <span className="font-bold text-red-600">{showDetail.result.details.length - showDetail.result.details.filter((d: any) => d.correct).length}</span></div>
            <div className="mb-2 text-sm sm:text-base">Thời gian nộp: {new Date(showDetail.result.submittedAt).toLocaleString('vi-VN', { hour12: false })}</div>
            {/* Nếu không cho phép xem lại đáp án thì chỉ hiển thị thông báo */}
            {showDetail.part && showDetail.part.showAnswerAfterSubmit === false ? (
              <div className="mt-6 text-center text-red-600 font-semibold text-base sm:text-lg">Bài thi này không cho phép xem lại câu hỏi.</div>
            ) : (
              <div className="mt-6">
                <h3 className="font-bold mb-2 text-base sm:text-lg">Chi tiết từng câu hỏi</h3>
                {showDetail.result.details.map((d: any, idx: number) => {
                  const q = showDetail.part?.questions?.find((qq: any) => qq.id === d.questionId) || showDetail.part?.questions?.[idx];
                  const questionContent = q?.content || d.question || `Câu hỏi ${idx + 1}`;
                  let isCorrect = d.correct;
                  // Ưu tiên hiển thị trường answer nếu có
                  let userAnswer = d.answer || '';
                  if (!userAnswer && q && q.options && d.optionIds) {
                    const userOptionIds = d.optionIds.split(',');
                    userAnswer = userOptionIds.map((oid: string) => {
                      const opt = q.options.find((o: any) => o.id === oid);
                      return opt ? opt.text : '';
                    }).filter(Boolean).join(', ');
                  }
                  if (!userAnswer) userAnswer = 'Không trả lời';
                  return (
                    <div key={idx} className="mb-4 p-2 sm:p-3 rounded border bg-slate-50">
                      <div className="font-semibold mb-1 text-sm sm:text-base">Câu {idx + 1}: {questionContent}</div>
                      <div className="mb-1 text-sm sm:text-base">Trả lời: <span className={isCorrect ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{userAnswer} {isCorrect ? '(Đúng)' : '(Sai)'}</span></div>
                      {(q && q.options) && (
                        <div className="mb-1 text-blue-700 text-sm sm:text-base">
                          Đáp án đúng: <span className="font-semibold">{
                            q.options.map((opt: any, i: number) => opt.isCorrect ? `${String.fromCharCode(65 + i)}. ${opt.text}` : null).filter(Boolean).join(', ')
                          }</span>
                        </div>
                      )}
                      <div className="text-sm sm:text-base">Điểm: <span className="font-bold">{d.point}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCourseResults; 