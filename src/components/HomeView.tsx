import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  ArrowRight, 
  Sparkles, 
  FileCheck2, 
  Layers, 
  QrCode, 
  ShieldCheck, 
  BookMarked,
  KeyRound,
  FileUp
} from 'lucide-react';

interface HomeViewProps {
  onSelectTeacher: () => void;
  onSelectStudent: (roomCode?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectTeacher,
  onSelectStudent,
}) => {
  const [quickCode, setQuickCode] = useState('');

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim()) {
      onSelectStudent(quickCode.trim());
    } else {
      onSelectStudent();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAF0E8] border border-[#C6D4C2] text-xs font-semibold text-[#3F4F39]">
            <Sparkles className="w-3.5 h-3.5 text-[#7A9070]" />
            <span>2026 교육부 기재요령 준수 AI 세특 솔루션</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2D3748] tracking-tight leading-tight">
            배움의 과정을 기록하고,<br />
            <span className="text-[#5B6F52]">의미 있는 생활기록부</span>를 완성합니다
          </h1>
          <p className="text-base sm:text-lg text-[#5A6A7E] leading-relaxed max-w-2xl mx-auto">
            학생은 4단계 포트폴리오로 자신의 지적 성장을 체계적으로 기록하고,
            선생님은 성취기준 연계 Gemini AI로 정갈한 세특 초안을 신속하게 도출합니다.
          </p>
        </div>

        {/* Quick Room Code Entry Bar */}
        <div className="max-w-md mx-auto">
          <form onSubmit={handleQuickJoin} className="relative flex items-center shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096]">
              <KeyRound className="w-4 h-4 text-[#7A9070]" />
            </div>
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              placeholder="학생 입장: 방 코드 입력 (예: tech2)"
              className="w-full pl-10 pr-24 py-3 bg-white border border-[#D9DEC9] rounded-xl text-sm text-[#2D3748] placeholder-[#A0AEC0] focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20 transition-all font-mono"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-2 bg-[#7A9070] hover:bg-[#687D5F] text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
            >
              <span>입장</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Dual Portal Cards (Teacher vs Student) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Teacher Portal Card */}
          <div 
            onClick={onSelectTeacher}
            className="group relative bg-white rounded-2xl p-7 border-2 border-[#EAEAE2] hover:border-[#7A9070] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF0E8] text-[#486341] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#486341] mb-1">
                  <span>교사용 대시보드</span>
                </div>
                <h3 className="text-xl font-bold text-[#2D3748] group-hover:text-[#486341] transition-colors">
                  선생님으로 시작하기
                </h3>
                <p className="text-sm text-[#718096] mt-2 leading-relaxed">
                  프로젝트 수업 방을 개설하고, 성취기준을 설정하여 학생들의 포트폴리오 실시간 진행 상황을 관리하고 AI 세특 초안을 생성합니다.
                </p>
              </div>

              <div className="pt-2 space-y-2 border-t border-[#F0F2EB] text-xs text-[#52634B]">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7A9070]"></div>
                  <span>방 코드 직접 지정 및 QR 코드 안내</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7A9070]"></div>
                  <span>4단계 작성률 실시간 모니터링</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7A9070]"></div>
                  <span>Gemini AI 세특 초안 생성 & NEIS 바이트 계산</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 flex items-center justify-between text-sm font-bold text-[#486341]">
              <span>교사 전용 대시보드 진입</span>
              <div className="w-8 h-8 rounded-full bg-[#EAF0E8] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Student Portal Card */}
          <div 
            onClick={() => onSelectStudent()}
            className="group relative bg-white rounded-2xl p-7 border-2 border-[#EAEAE2] hover:border-[#7A9070] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F4F5EE] text-[#5B6F52] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#5B6F52] mb-1">
                  <span>학생 포트폴리오</span>
                </div>
                <h3 className="text-xl font-bold text-[#2D3748] group-hover:text-[#5B6F52] transition-colors">
                  학생으로 입장하기
                </h3>
                <p className="text-sm text-[#718096] mt-2 leading-relaxed">
                  선생님이 안내한 방 코드와 본인의 학번, 이름으로 입장하여 4단계에 걸쳐 자신의 탐구 과정과 산출물을 기록합니다.
                </p>
              </div>

              <div className="pt-2 space-y-2 border-t border-[#F0F2EB] text-xs text-[#52634B]">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7A9070]"></div>
                  <span>방 코드 간편 로그인 (별도 이메일 가입 불필요)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7A9070]"></div>
                  <span>탐구·설계·산출·자기평가 4단계 아코디언</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7A9070]"></div>
                  <span>영상·PDF·HWP 대용량 파일 첨부 (최대 20MB)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 flex items-center justify-between text-sm font-bold text-[#5B6F52]">
              <span>포트폴리오 작성 시작</span>
              <div className="w-8 h-8 rounded-full bg-[#F4F5EE] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Highlights */}
        <div className="pt-6 border-t border-[#EAEAE2]">
          <div className="text-center mb-6">
            <h3 className="text-sm font-bold text-[#718096] tracking-wider uppercase">
              EduPortfolio의 핵심 강점
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#EAEAE2]">
              <div className="w-8 h-8 rounded-lg bg-[#EAF0E8] text-[#486341] flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#2D3748] mb-1">4단계 포트폴리오</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                탐구-설계-산출-자기평가의 단계별 아코디언으로 사고의 전 과정을 구조화합니다.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#EAEAE2]">
              <div className="w-8 h-8 rounded-lg bg-[#EAF0E8] text-[#486341] flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#2D3748] mb-1">성취기준 연계 AI</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                교과 성취기준과 학생 작성 내용을 융합해 나이스 표준 기재문구 세특 초안을 추출합니다.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#EAEAE2]">
              <div className="w-8 h-8 rounded-lg bg-[#EAF0E8] text-[#486341] flex items-center justify-center mb-3">
                <FileUp className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#2D3748] mb-1">20MB 멀티미디어 첨부</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                시제품 영상, 실험 사진, 한글(HWP) 보고서를 업로드하고 요약문을 연동합니다.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#EAEAE2]">
              <div className="w-8 h-8 rounded-lg bg-[#EAF0E8] text-[#486341] flex items-center justify-center mb-3">
                <QrCode className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#2D3748] mb-1">교실 프로젝터 QR</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                스크린에 QR 코드를 띄워 스마트폰과 태블릿으로 학생들이 1초 만에 참여합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 text-center text-xs text-[#A0AEC0] border-t border-[#EAEAE2]">
        <p>© 2026 세특 포트폴리오 (EduPortfolio). 교육부 학교생활기록부 기재요령 준수 시스템.</p>
      </footer>
    </div>
  );
};
