import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { getPartById, Part } from '../../../AdminPage/manage-part/PartApi';
import { auth, realtimeDb } from '../../../shared/firebase-config';
import ExamResultDetail from './ExamResultDetail';
import { ref, get, set } from 'firebase/database';

// --- INTERFACES ---
interface Question {
  id: string;
  content: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  correct?: number;
  correctAnswers?: number[];
  type?: string;
}

interface ResultDetail {
  questionId: string;
  correct: boolean;
  point: number;
  optionIds: string;
  answer?: string;
  question?: string;
}

interface FinalResults {
    details: ResultDetail[];
    score: number;
}

interface UserFormProps {
  partId: string;
  onBack: () => void;
}

// --- UTILITY FUNCTIONS ---
function shuffleArray<T>(arr: T[]): T[] {
    return arr
      .map(v => ({ sort: Math.random(), value: v }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
}

const UserForm: React.FC<UserFormProps> = ({ partId, onBack }) => {
  // --- STATE MANAGEMENT ---
  const [part, setPart] = useState<Part | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [id: string]: number | number[] | null }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [finalResults, setFinalResults] = useState<FinalResults | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailResults, setShowDetailResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveScreenCount, setLeaveScreenCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = React.useRef<any>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userStudentId, setUserStudentId] = useState('');
  const [userFullName, setUserFullName] = useState('');

  // --- EFFECTS ---
  useEffect(() => {
    if (!partId) return;
    getPartById(partId).then(p => {
      setPart(p);
      const qs = p.questions ? (p.randomizeQuestions ? shuffleArray(p.questions) : p.questions) : [];
      setQuestions(qs);
      setAnswers(Object.fromEntries(qs.map((q:any) => [q.id, isMultiChoice(q) ? [] : null])));
      setTimeLeft((p.duration || 60) * 60);
      setSubmitted(false);
      setFinalResults(null);
      setIsSubmitting(false);
    });
  }, [partId]);

  useEffect(() => {
    if (submitted || isSubmitting) return;
    if (questions.length === 0) return;
    if (timeLeft <= 0) {
      handleConfirmSubmit();
      return;
    }
    const timerRef = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef);
  }, [timeLeft, submitted, questions.length, isSubmitting]);

  useEffect(() => {
    if (auth.currentUser) {
      const user = auth.currentUser;
      setUserName(user.displayName || user.email || user.uid);
      setUserEmail(user.email || '');
      
      // Lấy thông tin chi tiết từ user profile nếu có
      if (user.displayName) {
        setUserFullName(user.displayName);
      }
      
      // Lấy mã sinh viên từ custom claims hoặc user metadata
      // Có thể cần fetch từ database để lấy thông tin đầy đủ
      setUserStudentId(user.uid); // Tạm thời dùng uid, có thể thay bằng studentId thực tế
    }
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setLeaveScreenCount((c) => c + 1);
        setShowWarning(true);
        sendViolation();
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShowWarning(false), 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(timerRef.current);
    };
  }, [userName, part]);

  // --- LOGIC HANDLERS ---
  const handleSelect = (qid: string, idx: number) => {
    if (submitted) return;
    setAnswers(a => {
        const q = questions.find(q => q.id === qid);
        if (isMultiChoice(q)) {
            const arr = Array.isArray(a[qid]) ? [...(a[qid] as number[])] : [];
            if (arr.includes(idx)) {
                return { ...a, [qid]: arr.filter(i => i !== idx) };
            } else {
                return { ...a, [qid]: [...arr, idx] };
            }
        } else {
            return { ...a, [qid]: idx };
        }
    });
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    if (isSubmitting || submitted) return;

    setIsSubmitting(true);

    const user = auth.currentUser;
    const detailsPayload = questions.map(q => {
        const ans = answers[q.id];
        let selectedOptionIds = '';

        if (isMultiChoice(q)) {
            const uniqueIdx = Array.isArray(ans) ? Array.from(new Set(ans as number[])) : [];
            selectedOptionIds = uniqueIdx
                .map(idx => {
                    const opt = q.options?.[idx];
                    // Nếu option không có id, tạo id dựa trên index
                    if (opt && !opt.id) {
                        opt.id = `opt_${idx}`;
                    }
                    return opt?.id || `opt_${idx}`;
                })
                .filter(id => id != null && id !== undefined && id !== '')
                .join(',');
        } else {
            if (typeof ans === 'number' && q.options?.[ans]) {
                const opt = q.options[ans];
                // Nếu option không có id, tạo id dựa trên index
                if (!opt.id) {
                    opt.id = `opt_${ans}`;
                }
                selectedOptionIds = opt.id;
            }
        }
        return {
            questionId: q.id,
            question: q.content,
            optionIds: selectedOptionIds || '',
        };
    });

    // Thêm log kiểm tra trước khi gửi
    console.log('answers:', answers);
    console.log('detailsPayload:', detailsPayload);

    const resultPayload = {
        userName: userFullName || userName || user?.displayName || user?.email || 'unknown',
        userEmail: userEmail,
        userStudentId: userStudentId,
        testName: part?.name || part?.id || 'unknown',
        testId: part?.id,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        details: detailsPayload,
        leaveScreenCount,
        userId: user?.uid,
    };

    try {
        const response = await axios.post('/api/exam-results/submit-and-get-result', resultPayload);
        if (response.data) {
            // Chuyển đổi từ ExamResult sang FinalResults để hiển thị
            const examResult = response.data;
            const finalResultsData: FinalResults = {
                details: examResult.details.map((detail: any) => ({
                    questionId: detail.questionId,
                    correct: detail.correct,
                    point: detail.point,
                    optionIds: detail.optionIds,
                    answer: detail.answer,
                    question: detail.question
                })),
                score: examResult.score
            };
            setFinalResults(finalResultsData);
        } else {
            throw new Error('Không nhận được kết quả từ server');
        }
    } catch (e) {
        console.error('Lỗi khi nộp bài và lấy kết quả:', e);
        alert('Đã có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
        setIsSubmitting(false);
        setSubmitted(true);
    }
  };

  function isMultiChoice(q: any): boolean {
    if (!q) return false;
    if (q.type === 'multiple' || q.type === 'multiple_choice') return true;
    const correctCount = Array.isArray(q.options)
      ? q.options.filter((opt: any) => opt.isCorrect === true).length
      : 0;
    return correctCount > 1;
  }

  const getOptionDisplayStatus = (question: Question, optionIndex: number): string => {
    if (!submitted) return 'default';

    const optionId = question.options[optionIndex]?.id;
    if (!optionId) return 'default';

    const correctOptionIds = new Set(question.options.filter(o => o.isCorrect).map(o => o.id));
    
    const resultDetail = finalResults?.details.find(d => d.questionId === question.id);
    const userSelectedIds = new Set(resultDetail?.optionIds?.split(',') || []);

    const isSelected = userSelectedIds.has(optionId);
    const isCorrect = correctOptionIds.has(optionId);

    if (isSelected && isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'wrong';
    if (!isSelected && isCorrect) return 'missed';
    
    return 'default';
  };

  // Hàm gửi cảnh báo lên Firebase
  const sendViolation = async () => {
    const user = auth.currentUser;
    if (!user || !part) return;
    const violationRef = ref(realtimeDb, `exam-violations/${part.id}/${user.uid}`);
    let prevCount = 0;
    try {
      const snap = await get(violationRef);
      if (snap.exists()) {
        prevCount = snap.val().count || 0;
      }
    } catch {}
    set(violationRef, {
      userId: user.uid,
      userName,
      examId: part.id,
      examName: part.name,
      timestamp: Date.now(),
      count: prevCount + 1,
    });
  };

  // --- RENDER ---
  if (!part) return <div className="text-center p-10">Đang tải đề thi...</div>;
  
  const currentQuestion = questions[currentIdx];

  const statusColorClasses: { [key: string]: string } = {
    default: 'bg-slate-50 border-slate-200 hover:bg-sky-50',
    correct: 'bg-green-600 text-white border-green-700 font-semibold',
    wrong: 'bg-red-600 text-white border-red-700 font-semibold',
    missed: 'bg-blue-200 border-blue-400 text-slate-800',
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <button 
              type="button" 
              className="px-4 py-2 bg-green-100 text-green-700 border border-green-400 rounded flex items-center gap-2 font-semibold hover:bg-green-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed" 
              onClick={() => setShowConfirmModal(true)} 
              disabled={submitted || isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {isSubmitting ? 'ĐANG NỘP BÀI...' : 'NỘP BÀI'}
          </button>
          <div className="flex gap-2 items-center">
             <div className="flex flex-col items-center px-3 py-1 rounded bg-blue-500 text-white font-bold min-w-[60px]">
               <span className="text-lg">{Math.floor(timeLeft/3600)}</span><span className="text-xs">GIỜ</span>
             </div>
             <div className="flex flex-col items-center px-3 py-1 rounded bg-green-500 text-white font-bold min-w-[60px]">
               <span className="text-lg">{Math.floor((timeLeft%3600)/60)}</span><span className="text-xs">PHÚT</span>
             </div>
             <div className="flex flex-col items-center px-3 py-1 rounded bg-yellow-400 text-white font-bold min-w-[60px]">
               <span className="text-lg">{(timeLeft%60).toString().padStart(2,'0')}</span><span className="text-xs">GIÂY</span>
             </div>
          </div>
        </div>

        {showWarning && (
          <div style={{ color: 'red', fontWeight: 'bold', marginBottom: 8 }}>
            Bạn vừa thoát ra khỏi màn hình thi, vui lòng chú ý!
          </div>
        )}

        {currentQuestion && (
            <div key={currentQuestion.id} className="mb-5 bg-white rounded-lg border shadow-sm p-4 ring-2 ring-sky-400">
                <div className="flex items-center mb-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-600 text-white font-bold mr-3">{currentIdx + 1}</span>
                    <span className="font-semibold text-base sm:text-lg">{currentQuestion.content}</span>
                </div>
                <div className="flex flex-col gap-2 mt-1">
                    {(currentQuestion.options || []).map((opt, i) => {
                        const displayStatus = getOptionDisplayStatus(currentQuestion, i);
                        return (
                            <label key={i} className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg transition text-base border ${submitted ? 'cursor-default' : 'cursor-pointer'} ${statusColorClasses[displayStatus]}`}>
                                <input
                                    type={isMultiChoice(currentQuestion) ? 'checkbox' : 'radio'}
                                    name={currentQuestion.id}
                                    checked={isMultiChoice(currentQuestion)
                                        ? Array.isArray(answers[currentQuestion.id]) && (answers[currentQuestion.id] as number[]).includes(i)
                                        : answers[currentQuestion.id] === i}
                                    onChange={() => handleSelect(currentQuestion.id, i)}
                                    disabled={submitted}
                                    className="w-4 h-4 accent-sky-600"
                                />
                                <span className="text-base sm:text-base">{String.fromCharCode(65+i)}. {typeof opt === 'string' ? opt : (opt && typeof opt === 'object' && 'text' in opt ? opt.text : '')}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        )}
        
        <div className="flex justify-between mt-4">
          <button type="button" className="px-4 py-2 bg-slate-200 rounded font-semibold disabled:opacity-50" disabled={currentIdx===0} onClick={()=>setCurrentIdx(i=>Math.max(0,i-1))}>Câu trước</button>
          <button type="button" className="px-4 py-2 bg-sky-600 text-white rounded font-semibold disabled:opacity-50" disabled={currentIdx===questions.length-1} onClick={()=>setCurrentIdx(i=>Math.min(questions.length-1,i+1))}>Câu sau</button>
        </div>

        {submitted && finalResults && (
             <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                 <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center relative animate-fade-in-up">
                     <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-2xl font-bold" onClick={() => setFinalResults(null)}>&times;</button>
                     <h2 className="text-2xl font-bold mb-2">Kết quả bài thi</h2>
                     <hr className="mb-6" />
                     <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                         <div>
                             <div className="text-3xl font-extrabold text-blue-600">{questions.length}</div>
                             <div className="text-sm text-slate-500">Tổng số câu</div>
                         </div>
                         <div>
                            <div className="text-3xl font-extrabold text-green-600">{finalResults.details.filter(d => d.correct).length}</div>
                             <div className="text-sm text-slate-500">Câu trả lời đúng</div>
                         </div>
                         <div>
                             <div className="text-3xl font-extrabold text-red-600">{finalResults.details.filter(d => !d.correct).length}</div>
                             <div className="text-sm text-slate-500">Câu trả lời sai</div>
                         </div>
                         <div>
                             <div className="text-3xl font-extrabold text-yellow-500">{finalResults.score.toFixed(1)} / {part?.score || questions.length}</div>
                             <div className="text-sm text-slate-500">Điểm số</div>
                         </div>
                     </div>
                     <div className="flex flex-col gap-2 mt-8">
                         <div className="flex gap-2">
                             <button onClick={() => setShowDetailResults(true)} className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                                Xem chi tiết
                             </button>
                             <button onClick={() => setFinalResults(null)} className="flex-1 px-6 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700">
                                Xem lại bài làm
                             </button>
                         </div>
                         <button 
                             onClick={() => {
                                 setFinalResults(null);
                                 onBack();
                             }} 
                             className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                         >
                             Thoát ra màn hình kết quả
                         </button>
                     </div>
                 </div>
             </div>
        )}

        {showDetailResults && finalResults && (
            <ExamResultDetail
                details={finalResults.details}
                score={finalResults.score}
                totalScore={part?.score || questions.length}
                onClose={() => setShowDetailResults(false)}
                onExitToResults={() => {
                    setShowDetailResults(false);
                    setFinalResults(null);
                    onBack();
                }}
            />
        )}

      </div>
      
      {/* Sidebar (bạn có thể thay thế bằng component sidebar của mình) */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="font-bold mb-2">Câu hỏi</div>
          <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
            {questions.map((q, idx) => (
              <button key={q.id} type="button" onClick={()=>setCurrentIdx(idx)}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-base
                  ${currentIdx===idx ? 'bg-sky-600 text-white border-sky-600' :
                    (Array.isArray(answers[q.id]) ? (answers[q.id] as number[]).length > 0 : answers[q.id] !== null)
                    ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-300 text-slate-500'}
                `}>
                {idx+1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center relative">
            <h2 className="text-xl font-bold mb-4">Xác nhận nộp bài</h2>
            <div className="mb-6">Bạn có chắc chắn muốn nộp bài không? Bạn sẽ không thể thay đổi câu trả lời sau khi nộp.</div>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-2 bg-slate-200 rounded font-bold" onClick={() => setShowConfirmModal(false)}>Hủy</button>
              <button className="px-6 py-2 bg-green-600 text-white rounded font-bold" onClick={handleConfirmSubmit}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserForm;