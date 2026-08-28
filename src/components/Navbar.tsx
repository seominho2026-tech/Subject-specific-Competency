import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  HelpCircle, 
  Home, 
  LogOut, 
  Sparkles, 
  FileText, 
  Layers, 
  CheckCircle2, 
  X,
  ChevronRight
} from 'lucide-react';

interface NavbarProps {
  currentRole: 'home' | 'teacher' | 'student';
  roomCode?: string;
  roomTitle?: string;
  studentName?: string;
  studentNumber?: string;
  onNavigateHome: () => void;
  onSwitchToStudent?: () => void;
  onSwitchToTeacher?: () => void;
  onStudentExit?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  roomCode,
  roomTitle,
  studentName,
  studentNumber,
  onNavigateHome,
  onSwitchToStudent,
  onSwitchToTeacher,
  onStudentExit,
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#EAEAE2] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo and App Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateHome}>
            <div className="w-10 h-10 rounded-xl bg-[#7A9070] flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-[#2D3748] tracking-tight">세특 포트폴리오</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EAF0E8] text-[#486341] border border-[#C6D4C2]">
                  EduPortfolio
                </span>
              </div>
              <p className="text-[11px] text-[#718096] hidden sm:block">
                교사-학생 협업 생활기록부 세특 플랫폼
              </p>
            </div>
          </div>

          {/* Center: Context info (if in room) */}
          {roomCode && (
            <div className="hidden md:flex items-center space-x-2 bg-[#F4F5EE] px-3 py-1.5 rounded-lg border border-[#E2E4D8] text-xs">
              <span className="font-semibold text-[#486341] bg-[#E2EBDD] px-2 py-0.5 rounded font-mono">
                방 코드: {roomCode}
              </span>
              {roomTitle && (
                <span className="text-[#4A5568] max-w-[200px] truncate font-medium">
                  {roomTitle}
                </span>
              )}
              {studentName && (
                <span className="text-[#2D3748] font-semibold border-l border-[#CBD5E0] pl-2">
                  {studentNumber} {studentName}
                </span>
              )}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Help Guide Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-[#4A5568] hover:text-[#2D3748] hover:bg-[#F4F5EE] rounded-lg transition-colors border border-transparent hover:border-[#E2E4D8]"
              title="사용 가이드 및 세특 작성 안내"
            >
              <HelpCircle className="w-4 h-4 text-[#7A9070]" />
              <span className="hidden sm:inline">가이드</span>
            </button>

            {/* Role indicator & Exit button */}
            {currentRole === 'student' && onStudentExit && (
              <button
                onClick={onStudentExit}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#C53030] bg-[#FFF5F5] hover:bg-[#FED7D7] border border-[#FEB2B2] rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>다른 방 입장</span>
              </button>
            )}

            {currentRole === 'teacher' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#EAF0E8] text-[#3F4F39] border border-[#C6D4C2]">
                  교사용 모드
                </span>
                <button
                  onClick={onNavigateHome}
                  className="p-1.5 text-[#718096] hover:text-[#2D3748] hover:bg-[#F4F5EE] rounded-lg transition-colors"
                  title="홈 화면으로"
                >
                  <Home className="w-4 h-4" />
                </button>
              </div>
            )}

            {currentRole === 'home' && (
              <div className="flex items-center space-x-2">
                {onSwitchToTeacher && (
                  <button
                    onClick={onSwitchToTeacher}
                    className="px-3 py-1.5 text-xs font-semibold text-[#486341] hover:bg-[#EAF0E8] rounded-lg transition-colors"
                  >
                    선생님 포털
                  </button>
                )}
                {onSwitchToStudent && (
                  <button
                    onClick={onSwitchToStudent}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#7A9070] hover:bg-[#687D5F] rounded-lg transition-colors shadow-2xs"
                  >
                    학생 입장
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl border border-[#EAEAE2] p-6">
            <div className="flex items-center justify-between border-b border-[#EAEAE2] pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF0E8] flex items-center justify-center text-[#486341]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#2D3748]">세특 포트폴리오 이용 가이드</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-[#718096] hover:bg-[#F4F5EE] hover:text-[#2D3748]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-sm text-[#4A5568]">
              {/* 4 Steps Section */}
              <div>
                <h4 className="font-bold text-[#2D3748] flex items-center space-x-1.5 mb-2.5">
                  <Layers className="w-4 h-4 text-[#7A9070]" />
                  <span>학생 4단계 포트폴리오 구조</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[#F9F9F6] rounded-xl border border-[#EAEAE2]">
                    <p className="font-semibold text-[#3F4F39] text-xs mb-1">1. 탐구 (Exploration)</p>
                    <p className="text-xs text-[#718096]">탐구 동기, 핵심 질문/가설, 선행 자료 조사 및 이론적 배경 정리</p>
                  </div>
                  <div className="p-3 bg-[#F9F9F6] rounded-xl border border-[#EAEAE2]">
                    <p className="font-semibold text-[#3F4F39] text-xs mb-1">2. 설계 (Design)</p>
                    <p className="text-xs text-[#718096]">구체적 수행 계획, 역할 분담, 활용 도구 및 알고리즘/프로세스 설계</p>
                  </div>
                  <div className="p-3 bg-[#F9F9F6] rounded-xl border border-[#EAEAE2]">
                    <p className="font-semibold text-[#3F4F39] text-xs mb-1">3. 산출/성찰 (Outcome)</p>
                    <p className="text-xs text-[#718096]">최종 산출물 핵심 요약, 오류 극복 및 문제 해결 과정, 배운 점</p>
                  </div>
                  <div className="p-3 bg-[#F9F9F6] rounded-xl border border-[#EAEAE2]">
                    <p className="font-semibold text-[#3F4F39] text-xs mb-1">4. 자기평가 (Self-Eval)</p>
                    <p className="text-xs text-[#718096]">핵심 역량 성장도 자가 진단 및 후속 심화 탐구/발전 계획 수립</p>
                  </div>
                </div>
              </div>

              {/* AI Setuk Section */}
              <div className="p-4 bg-[#F4F7F2] rounded-xl border border-[#C6D4C2]">
                <h4 className="font-bold text-[#3F4F39] flex items-center space-x-1.5 mb-1.5">
                  <Sparkles className="w-4 h-4 text-[#7A9070]" />
                  <span>Gemini AI 세특 초안 생성 원리</span>
                </h4>
                <p className="text-xs text-[#52634B] leading-relaxed">
                  선생님이 프로젝트 생성 시 등록한 <strong>'교육과정 성취기준'</strong>과 학생이 직접 작성한 <strong>'4단계 포트폴리오 및 첨부자료 요약'</strong>을 결합하여, 교육부 학교생활기록부 기재요령 표준 서식(~함, ~임 종결형)에 맞는 고품질 세특 초안을 생성합니다.
                </p>
              </div>

              {/* Tips */}
              <div>
                <h4 className="font-bold text-[#2D3748] mb-2 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#7A9070]" />
                  <span>활용 팁</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-[#4A5568]">
                  <li className="flex items-start space-x-2">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7A9070] shrink-0 mt-0.5" />
                    <span><strong>방 코드 공유</strong>: 방 상세 화면의 QR 코드 또는 링크 복사를 통해 학생들에게 바로 전달할 수 있습니다.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7A9070] shrink-0 mt-0.5" />
                    <span><strong>파일 첨부</strong>: 이미지, PDF, HWP, 영상 등 최대 20MB까지 자유롭게 첨부하고 요약문을 남길 수 있습니다.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <ChevronRight className="w-3.5 h-3.5 text-[#7A9070] shrink-0 mt-0.5" />
                    <span><strong>NEIS 바이트 계산</strong>: 생성된 세특은 나이스 기준 한글 3Byte 정밀 계산기가 내장되어 글자수 관리가 수월합니다.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EAEAE2] flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#7A9070] hover:bg-[#687D5F] rounded-lg transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
