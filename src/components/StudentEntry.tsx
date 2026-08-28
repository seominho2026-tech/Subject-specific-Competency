import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  KeyRound, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  Lock, 
  GraduationCap, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { checkRoomExists, authenticateStudent, getOrCreateStudentRecord } from '../firebase';
import type { ClassRoom, StudentRecord } from '../types';

interface StudentEntryProps {
  initialRoomCode?: string;
  onBack: () => void;
  onStudentEntered: (room: ClassRoom, student: StudentRecord) => void;
}

export const StudentEntry: React.FC<StudentEntryProps> = ({
  initialRoomCode = '',
  onBack,
  onStudentEntered,
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [studentNumber, setStudentNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState<ClassRoom | null>(null);
  const [isCheckingRoom, setIsCheckingRoom] = useState(false);

  // Auto check room if initialRoomCode exists
  useEffect(() => {
    if (initialRoomCode) {
      handleCheckRoom(initialRoomCode);
    }
  }, [initialRoomCode]);

  const handleCheckRoom = async (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) {
      setRoomInfo(null);
      return;
    }

    try {
      setIsCheckingRoom(true);
      const room = await checkRoomExists(clean);
      setRoomInfo(room);
      if (!room) {
        setErrorMessage(`방 코드 "${clean}"에 해당하는 수업을 찾을 수 없습니다. 선생님께 확인해주세요.`);
      } else {
        setErrorMessage('');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsCheckingRoom(false);
    }
  };

  const handleRoomCodeBlur = () => {
    if (roomCode.trim()) {
      handleCheckRoom(roomCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = roomCode.trim().toLowerCase();
    const cleanNum = studentNumber.trim();
    const cleanName = studentName.trim();

    if (!cleanCode) {
      setErrorMessage('방 코드를 입력해주세요.');
      return;
    }
    if (!cleanNum) {
      setErrorMessage('학번을 입력해주세요 (예: 20415).');
      return;
    }
    if (!cleanName) {
      setErrorMessage('이름을 입력해주세요.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('비밀번호는 4자리 이상 입력해주세요 (향후 재접속 시 사용).');
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Check if room exists
      const room = await checkRoomExists(cleanCode);
      if (!room) {
        throw new Error(`방 코드 "${cleanCode}"가 존재하지 않습니다. 코드를 다시 확인해주세요.`);
      }

      // 2. Authenticate student seamlessly via Firebase Auth
      const { user } = await authenticateStudent(cleanCode, cleanNum, cleanName, password);

      // 3. Get or create student record in Firestore
      const studentRecord = await getOrCreateStudentRecord(
        cleanCode,
        cleanNum,
        cleanName,
        user.uid,
        user.email || undefined
      );

      onStudentEntered(room, studentRecord);
    } catch (err: any) {
      setErrorMessage(err.message || '입장 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill sample for fast testing
  const handleQuickFillSample = () => {
    setStudentNumber('20415');
    setStudentName('김하늘');
    setPassword('1234');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center max-w-lg mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl p-7 sm:p-8 border-2 border-[#EAEAE2] shadow-xl w-full space-y-6">
        {/* Top Back & Header */}
        <div className="flex items-center justify-between border-b border-[#EAEAE2] pb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-[#718096] hover:text-[#2D3748] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>메인 화면으로</span>
          </button>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EAF0E8] text-[#486341] border border-[#C6D4C2]">
            학생 전용 입장
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF0E8] text-[#486341] flex items-center justify-center mx-auto mb-2">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#2D3748] tracking-tight">
            포트폴리오 입장하기
          </h2>
          <p className="text-xs text-[#718096]">
            선생님이 안내한 방 코드와 본인의 학번, 이름을 입력하세요.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-[#FFF5F5] border border-[#FEB2B2] rounded-xl flex items-start space-x-2 text-xs text-[#C53030]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Room Info Badge if verified */}
        {roomInfo && (
          <div className="p-3 bg-[#F4F7F2] border border-[#C6D4C2] rounded-xl flex items-center space-x-2.5">
            <GraduationCap className="w-5 h-5 text-[#7A9070] shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-[#3F4F39]">{roomInfo.title}</p>
              <p className="text-[11px] text-[#52634B]">
                {roomInfo.subject} ({roomInfo.grade}) • 담당: {roomInfo.teacherName || '선생님'}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Code */}
          <div>
            <label className="block text-xs font-bold text-[#2D3748] mb-1">
              방 코드 (선생님께 받은 영문/숫자 코드) <span className="text-[#C53030]">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#7A9070] absolute left-3.5 top-3" />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                onBlur={handleRoomCodeBlur}
                placeholder="예: tech2, bio2026"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-sm font-mono text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                required
              />
            </div>
          </div>

          {/* Student Number & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2D3748] mb-1">
                학번 <span className="text-[#C53030]">*</span>
              </label>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="예: 20415 또는 2-4-15"
                className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-sm text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D3748] mb-1">
                이름 <span className="text-[#C53030]">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="예: 김하늘"
                className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-sm text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#2D3748]">
                접속 비밀번호 (4자리 이상) <span className="text-[#C53030]">*</span>
              </label>
              <span className="text-[10px] text-[#718096]">나중에 다시 작성할 때 사용</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7A9070] absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 4자리 이상 설정"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-sm text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isCheckingRoom}
            className="w-full py-3 bg-[#7A9070] hover:bg-[#687D5F] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span>입장 처리 중...</span>
            ) : (
              <>
                <span>포트폴리오 작성 시작하기</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Input Helper */}
        <div className="pt-2 border-t border-[#F0F2EB] flex items-center justify-between text-xs text-[#718096]">
          <span>테스트용 빠른 입력:</span>
          <button
            type="button"
            onClick={handleQuickFillSample}
            className="text-[11px] font-semibold text-[#486341] hover:underline"
          >
            20415 김하늘 / 1234 자동 채우기
          </button>
        </div>
      </div>
    </div>
  );
};
