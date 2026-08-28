import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Check, 
  Upload, 
  FileText, 
  Paperclip, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  Lock,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ClassRoom, StudentRecord, PortfolioStages, AttachedFile } from '../types';
import { saveStudentRecord, calculateCompletedStages } from '../firebase';
import { formatBytes, formatDate, getFileCategory } from '../utils/formatters';

interface StudentPortfolioProps {
  room: ClassRoom;
  student: StudentRecord;
  onExit: () => void;
}

export const StudentPortfolio: React.FC<StudentPortfolioProps> = ({
  room,
  student,
  onExit,
}) => {
  // Stages local state
  const [stages, setStages] = useState<PortfolioStages>(student.stages);
  const [attachments, setAttachments] = useState<AttachedFile[]>(student.attachments || []);

  // Accordion open states
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    exploration: true,
    design: false,
    outcome: false,
    selfEvaluation: false,
  });

  // Save status & loading
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'dirty' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>(student.updatedAt || new Date().toISOString());
  const [errorMessage, setErrorMessage] = useState('');

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Completion calculation
  const completedCount = calculateCompletedStages(stages);
  const completionPercentage = Math.round((completedCount / 4) * 100);

  // Handle stage text field change
  const handleFieldChange = (stageName: keyof PortfolioStages, field: string, value: string) => {
    setStages((prev) => ({
      ...prev,
      [stageName]: {
        ...prev[stageName],
        [field]: value,
      },
    }));
    setSaveStatus('dirty');
  };

  // Toggle single accordion section
  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Expand or collapse all
  const setAllSections = (isOpen: boolean) => {
    setOpenSections({
      exploration: isOpen,
      design: isOpen,
      outcome: isOpen,
      selfEvaluation: isOpen,
    });
  };

  // Save portfolio to Firestore
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      setErrorMessage('');

      await saveStudentRecord(room.id, student.id, stages, attachments);
      
      setSaveStatus('saved');
      setLastSavedTime(new Date().toISOString());

      // Trigger confetti if all 4 stages are completed
      if (calculateCompletedStages(stages) === 4) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.85 },
          colors: ['#7A9070', '#5B6F52', '#A3B899', '#D9DEC9'],
        });
      }
    } catch (err: any) {
      setSaveStatus('dirty');
      setErrorMessage(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stages, attachments, room.id, student.id]);

  // File Upload Handler (with Serverless / Base64 fallback for Vercel)
  const handleFileUpload = async (filesToUpload: FileList | File[]) => {
    if (!filesToUpload || filesToUpload.length === 0) return;
    setUploadError('');

    // Check 20MB limit
    const oversized = Array.from(filesToUpload).find((f) => f.size > 20 * 1024 * 1024);
    if (oversized) {
      setUploadError(`파일 "${oversized.name}"의 크기가 20MB를 초과합니다. 20MB 이하의 파일만 업로드할 수 있습니다.`);
      return;
    }

    try {
      setIsUploading(true);
      const filesArray = Array.from(filesToUpload);
      let newAttachments: AttachedFile[] = [];

      try {
        const formData = new FormData();
        filesArray.forEach((f) => formData.append('files', f));

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.files && data.files.length > 0) {
            newAttachments = data.files.map((file: any) => ({
              id: file.id || `${Date.now()}_${Math.random()}`,
              originalName: file.originalName,
              url: file.url,
              size: file.size,
              mimeType: file.mimeType,
              title: file.originalName.replace(/\.[^/.]+$/, ''),
              summary: '',
              uploadedAt: file.uploadedAt || new Date().toISOString(),
            }));
          }
        }
      } catch {
        // Fallback to client-side data URL
      }

      // If server upload didn't produce attachments (e.g. Vercel serverless environment), process client-side
      if (newAttachments.length === 0) {
        for (const file of filesArray) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newAttachments.push({
            id: `file_${Date.now()}_${Math.round(Math.random() * 1e4)}`,
            originalName: file.name,
            url: dataUrl,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            title: file.name.replace(/\.[^/.]+$/, ''),
            summary: '',
            uploadedAt: new Date().toISOString(),
          });
        }
      }

      if (newAttachments.length > 0) {
        const updatedAttachments = [...attachments, ...newAttachments];
        setAttachments(updatedAttachments);
        setSaveStatus('dirty');

        // Auto save to Firestore
        await saveStudentRecord(room.id, student.id, stages, updatedAttachments);
        setSaveStatus('saved');
      }
    } catch (err: any) {
      setUploadError(err.message || '파일 업로드 중 문제가 발생했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAttachmentChange = (id: string, field: 'title' | 'summary', value: string) => {
    setAttachments((prev) =>
      prev.map((att) => (att.id === id ? { ...att, [field]: value } : att))
    );
    setSaveStatus('dirty');
  };

  const handleDeleteAttachment = async (id: string) => {
    const updated = attachments.filter((att) => att.id !== id);
    setAttachments(updated);
    setSaveStatus('dirty');
    await saveStudentRecord(room.id, student.id, stages, updated);
    setSaveStatus('saved');
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] pb-28">
      {/* Sticky Top Header */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-xs border-b border-[#EAEAE2] px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onExit}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#F4F5EE] hover:bg-[#EAEAE2] text-xs font-bold text-[#4A5568] transition-colors border border-[#D9DEC9]"
              title="다른 방으로 입장하기"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>다른 방 입장 (뒤로)</span>
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-[#2D3748]">{student.studentName}</span>
                <span className="text-xs text-[#718096] font-mono font-medium">({student.studentNumber})</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#EAF0E8] text-[#486341] font-mono">
                  방 코드: {room.id}
                </span>
              </div>
            </div>
          </div>

          {/* Autosave Status Indicator */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              {saveStatus === 'saving' && (
                <span className="text-[#D69E2E] font-medium flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#D69E2E] animate-ping" />
                  <span>저장 중...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-[#38A169] font-medium flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>저장 완료 ({formatDate(lastSavedTime)})</span>
                </span>
              )}
              {saveStatus === 'dirty' && (
                <span className="text-[#E53E3E] font-medium flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#E53E3E]" />
                  <span>수정 사항 있음 (Ctrl+S로 저장)</span>
                </span>
              )}
            </div>

            {/* Quick Expand/Collapse */}
            <div className="hidden sm:flex items-center space-x-1 border-l border-[#E2E4D8] pl-3 text-[#718096]">
              <button
                onClick={() => setAllSections(true)}
                className="hover:text-[#2D3748] text-[11px] px-1.5 py-0.5 rounded hover:bg-[#F4F5EE]"
              >
                전체 펼치기
              </button>
              <span>/</span>
              <button
                onClick={() => setAllSections(false)}
                className="hover:text-[#2D3748] text-[11px] px-1.5 py-0.5 rounded hover:bg-[#F4F5EE]"
              >
                접기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Project & Achievement Standard Notice Card */}
        <div className="bg-white rounded-2xl border border-[#D9DEC9] p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F2EB] pb-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-bold text-[#486341] bg-[#EAF0E8] px-2.5 py-0.5 rounded-md">
                  {room.subject}
                </span>
                <span className="text-xs text-[#718096]">{room.grade}</span>
              </div>
              <h1 className="text-xl font-bold text-[#2D3748]">{room.title}</h1>
            </div>
            <div className="text-xs text-[#718096]">
              담당: <strong>{room.teacherName || '선생님'}</strong>
            </div>
          </div>

          {room.description && (
            <p className="text-xs text-[#4A5568] leading-relaxed">
              {room.description}
            </p>
          )}

          {/* Achievement Standard Box */}
          <div className="p-3.5 bg-[#F4F7F2] rounded-xl border border-[#C6D4C2] space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#3F4F39]">
              <BookOpen className="w-4 h-4 text-[#7A9070]" />
              <span>평가 및 AI 세특 연계 성취기준</span>
            </div>
            <p className="text-xs text-[#52634B] leading-relaxed">
              {room.achievementStandards}
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 bg-[#FFF5F5] border border-[#FEB2B2] rounded-xl flex items-center space-x-2 text-xs text-[#C53030]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 4-Step Accordion Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#2D3748] flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#7A9070]" />
              <span>4단계 포트폴리오 작성</span>
            </h2>
            <span className="text-xs font-bold text-[#486341]">
              {completedCount} / 4단계 완료 ({completionPercentage}%)
            </span>
          </div>

          {/* STAGE 1: Exploration (탐구) */}
          <div className="bg-white rounded-2xl border-2 border-[#EAEAE2] overflow-hidden shadow-xs">
            <div
              onClick={() => toggleSection('exploration')}
              className="px-5 py-4 bg-white hover:bg-[#F9F9F6] cursor-pointer flex items-center justify-between transition-colors border-b border-[#EAEAE2]"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  stages.exploration?.topic?.trim() || stages.exploration?.motivation?.trim()
                    ? 'bg-[#7A9070] text-white'
                    : 'bg-[#EAF0E8] text-[#486341]'
                }`}>
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D3748] flex items-center space-x-2">
                    <span>1단계: 탐구 (Exploration)</span>
                    {(stages.exploration?.topic?.trim() || stages.exploration?.motivation?.trim()) && (
                      <span className="text-[11px] font-bold text-[#38A169] flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>작성완료</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#718096]">탐구 주제 선정, 동기 및 필요성, 핵심 질문/가설, 선행 조사</p>
                </div>
              </div>
              <div className="text-[#718096]">
                {openSections.exploration ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            {openSections.exploration && (
              <div className="p-5 space-y-4 bg-white">
                {/* 1-1 Topic */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#2D3748]">
                      탐구 주제 / 프로젝트 명칭 <span className="text-[#C53030]">*</span>
                    </label>
                    <span className="text-[11px] text-[#A0AEC0]">{stages.exploration.topic?.length || 0}자</span>
                  </div>
                  <input
                    type="text"
                    value={stages.exploration.topic}
                    onChange={(e) => handleFieldChange('exploration', 'topic', e.target.value)}
                    placeholder="예: 컴퓨터 비전 객체 인식을 활용한 스마트 재활용 분리수거함 설계"
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                  />
                </div>

                {/* 1-2 Motivation */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#2D3748]">
                      탐구 동기 및 필요성 <span className="text-[#C53030]">*</span>
                    </label>
                    <span className="text-[11px] text-[#A0AEC0]">{stages.exploration.motivation?.length || 0}자</span>
                  </div>
                  <textarea
                    rows={3}
                    value={stages.exploration.motivation}
                    onChange={(e) => handleFieldChange('exploration', 'motivation', e.target.value)}
                    placeholder="이 주제를 탐구하게 된 계기, 문제 상황, 본인이 느낀 지적 호기심을 서술하세요."
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                  />
                </div>

                {/* 1-3 Key Question / Hypothesis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#2D3748]">
                        핵심 탐구 질문 및 가설
                      </label>
                      <span className="text-[11px] text-[#A0AEC0]">{stages.exploration.question?.length || 0}자</span>
                    </div>
                    <textarea
                      rows={3}
                      value={stages.exploration.question}
                      onChange={(e) => handleFieldChange('exploration', 'question', e.target.value)}
                      placeholder="예: 경량화 CNN 모델을 적용하면 아두이노 환경에서도 90% 이상의 분류 정확도를 달성할 수 있을 것이다."
                      className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#2D3748]">
                        선행 자료 조사 및 이론적 배경
                      </label>
                      <span className="text-[11px] text-[#A0AEC0]">{stages.exploration.backgroundResearch?.length || 0}자</span>
                    </div>
                    <textarea
                      rows={3}
                      value={stages.exploration.backgroundResearch}
                      onChange={(e) => handleFieldChange('exploration', 'backgroundResearch', e.target.value)}
                      placeholder="참고한 논문, 도서, 학술 데이터, 전공 이론(예: 서보모터 PWM 제어 원리, 합성곱 신경망 특징 추출 등)을 요약하세요."
                      className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STAGE 2: Design (설계) */}
          <div className="bg-white rounded-2xl border-2 border-[#EAEAE2] overflow-hidden shadow-xs">
            <div
              onClick={() => toggleSection('design')}
              className="px-5 py-4 bg-white hover:bg-[#F9F9F6] cursor-pointer flex items-center justify-between transition-colors border-b border-[#EAEAE2]"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  stages.design?.plan?.trim() || stages.design?.toolsAndTech?.trim()
                    ? 'bg-[#7A9070] text-white'
                    : 'bg-[#EAF0E8] text-[#486341]'
                }`}>
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D3748] flex items-center space-x-2">
                    <span>2단계: 설계 (Design)</span>
                    {(stages.design?.plan?.trim() || stages.design?.toolsAndTech?.trim()) && (
                      <span className="text-[11px] font-bold text-[#38A169] flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>작성완료</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#718096]">수행 계획, 역할 분담, 활용 도구 및 기술, 프로세스/알고리즘 설계</p>
                </div>
              </div>
              <div className="text-[#718096]">
                {openSections.design ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            {openSections.design && (
              <div className="p-5 space-y-4 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 2-1 Plan */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#2D3748]">
                        연구 / 개발 수행 계획 및 일정
                      </label>
                      <span className="text-[11px] text-[#A0AEC0]">{stages.design.plan?.length || 0}자</span>
                    </div>
                    <textarea
                      rows={3}
                      value={stages.design.plan}
                      onChange={(e) => handleFieldChange('design', 'plan', e.target.value)}
                      placeholder="단계별 탐구 일정, 실험 프로세스, 데이터 수집 계획을 작성하세요."
                      className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                    />
                  </div>

                  {/* 2-2 Roles */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#2D3748]">
                        모둠 내 역할 분담 및 협력 내용
                      </label>
                      <span className="text-[11px] text-[#A0AEC0]">{stages.design.roles?.length || 0}자</span>
                    </div>
                    <textarea
                      rows={3}
                      value={stages.design.roles}
                      onChange={(e) => handleFieldChange('design', 'roles', e.target.value)}
                      placeholder="본인이 담당한 핵심 역할과 동료들과의 협업 방식을 구체적으로 기술하세요."
                      className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 2-3 Tools & Tech */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#2D3748]">
                        활용 도구, 소프트웨어 및 기술
                      </label>
                      <span className="text-[11px] text-[#A0AEC0]">{stages.design.toolsAndTech?.length || 0}자</span>
                    </div>
                    <textarea
                      rows={3}
                      value={stages.design.toolsAndTech}
                      onChange={(e) => handleFieldChange('design', 'toolsAndTech', e.target.value)}
                      placeholder="예: Python, OpenCV, Arduino, 3D 프린터, 엑셀 통계분석 등 활용 장비 및 라이브러리"
                      className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                    />
                  </div>

                  {/* 2-4 Process Design */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#2D3748]">
                        구체적 알고리즘 / 실험 절차 / 회로 설계
                      </label>
                      <span className="text-[11px] text-[#A0AEC0]">{stages.design.processDesign?.length || 0}자</span>
                    </div>
                    <textarea
                      rows={3}
                      value={stages.design.processDesign}
                      onChange={(e) => handleFieldChange('design', 'processDesign', e.target.value)}
                      placeholder="구체적인 설계 로직(의사코드, 순서도, 변인 통제 조건 등)을 기술하세요."
                      className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STAGE 3: Outcome & Reflection (산출/성찰) */}
          <div className="bg-white rounded-2xl border-2 border-[#EAEAE2] overflow-hidden shadow-xs">
            <div
              onClick={() => toggleSection('outcome')}
              className="px-5 py-4 bg-white hover:bg-[#F9F9F6] cursor-pointer flex items-center justify-between transition-colors border-b border-[#EAEAE2]"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  stages.outcome?.finalResult?.trim() || stages.outcome?.problemSolving?.trim()
                    ? 'bg-[#7A9070] text-white'
                    : 'bg-[#EAF0E8] text-[#486341]'
                }`}>
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D3748] flex items-center space-x-2">
                    <span>3단계: 산출 및 성찰 (Outcome & Reflection)</span>
                    {(stages.outcome?.finalResult?.trim() || stages.outcome?.problemSolving?.trim()) && (
                      <span className="text-[11px] font-bold text-[#38A169] flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>작성완료</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#718096]">최종 산출물 결과, 오류 극복 및 문제 해결 과정, 배운 점</p>
                </div>
              </div>
              <div className="text-[#718096]">
                {openSections.outcome ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            {openSections.outcome && (
              <div className="p-5 space-y-4 bg-white">
                {/* 3-1 Final Result */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#2D3748]">
                      최종 산출물 내용 및 주요 기능 <span className="text-[#C53030]">*</span>
                    </label>
                    <span className="text-[11px] text-[#A0AEC0]">{stages.outcome.finalResult?.length || 0}자</span>
                  </div>
                  <textarea
                    rows={3}
                    value={stages.outcome.finalResult}
                    onChange={(e) => handleFieldChange('outcome', 'finalResult', e.target.value)}
                    placeholder="제작된 프로그램, 시제품, 보고서의 정량적/정성적 성과를 기술하세요. (예: 인식 정확도 94.2% 달성 등)"
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                  />
                </div>

                {/* 3-2 Problem Solving (Crucial for Setuk!) */}
                <div className="p-3.5 bg-[#F4F7F2] rounded-xl border border-[#C6D4C2] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#3F4F39] flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-[#7A9070]" />
                      <span>문제점 직면 및 해결 과정 (오류 극복 경험) <span className="text-[#C53030]">*</span></span>
                    </label>
                    <span className="text-[11px] text-[#52634B]">{stages.outcome.problemSolving?.length || 0}자</span>
                  </div>
                  <p className="text-[11px] text-[#52634B]">
                    💡 생활기록부에서 가장 중요하게 평가되는 항목입니다. 어떤 오류나 한계가 있었고, 이를 어떻게 분석하여 해결했는지 적어주세요.
                  </p>
                  <textarea
                    rows={4}
                    value={stages.outcome.problemSolving}
                    onChange={(e) => handleFieldChange('outcome', 'problemSolving', e.target.value)}
                    placeholder="예: 조명 반사로 인한 이미지 인식 오류를 데이터 증강(밝기/대비 변환) 알고리즘을 도입하여 65%에서 94%로 개선함."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                  />
                </div>

                {/* 3-3 Insights */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#2D3748]">
                      새롭게 알게 된 점 및 학문적 성찰
                    </label>
                    <span className="text-[11px] text-[#A0AEC0]">{stages.outcome.insights?.length || 0}자</span>
                  </div>
                  <textarea
                    rows={3}
                    value={stages.outcome.insights}
                    onChange={(e) => handleFieldChange('outcome', 'insights', e.target.value)}
                    placeholder="프로젝트 수행을 통해 교과 지식을 실제로 적용해보며 깨달은 학술적 통찰을 서술하세요."
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STAGE 4: Self Evaluation (자기평가) */}
          <div className="bg-white rounded-2xl border-2 border-[#EAEAE2] overflow-hidden shadow-xs">
            <div
              onClick={() => toggleSection('selfEvaluation')}
              className="px-5 py-4 bg-white hover:bg-[#F9F9F6] cursor-pointer flex items-center justify-between transition-colors border-b border-[#EAEAE2]"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  stages.selfEvaluation?.competencyGrowth?.trim() || stages.selfEvaluation?.reflection?.trim()
                    ? 'bg-[#7A9070] text-white'
                    : 'bg-[#EAF0E8] text-[#486341]'
                }`}>
                  4
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2D3748] flex items-center space-x-2">
                    <span>4단계: 자기평가 (Self-Evaluation)</span>
                    {(stages.selfEvaluation?.competencyGrowth?.trim() || stages.selfEvaluation?.reflection?.trim()) && (
                      <span className="text-[11px] font-bold text-[#38A169] flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>작성완료</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#718096]">핵심 역량 성장도, 자기 성찰, 향후 심화 탐구 계획</p>
                </div>
              </div>
              <div className="text-[#718096]">
                {openSections.selfEvaluation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            {openSections.selfEvaluation && (
              <div className="p-5 space-y-4 bg-white">
                {/* 4-1 Competency */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#2D3748]">
                      핵심 역량 기여도 및 자신의 강점 발휘
                    </label>
                    <span className="text-[11px] text-[#A0AEC0]">{stages.selfEvaluation.competencyGrowth?.length || 0}자</span>
                  </div>
                  <textarea
                    rows={3}
                    value={stages.selfEvaluation.competencyGrowth}
                    onChange={(e) => handleFieldChange('selfEvaluation', 'competencyGrowth', e.target.value)}
                    placeholder="창의·융합사고력, 비판적 사고력, 문제해결력, 의사소통 및 협업 역량 중 자신이 크게 성장했다고 느끼는 부분을 서술하세요."
                    className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 4-2 Reflection */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#2D3748]">
                        자기 성찰 및 아쉬웠던 점
                      </label>
                      <span className="text-[11px] text-[#A0AEC0]">{stages.selfEvaluation.reflection?.length || 0}자</span>
                    </div>
                    <textarea
                      rows={3}
                      value={stages.selfEvaluation.reflection}
                      onChange={(e) => handleFieldChange('selfEvaluation', 'reflection', e.target.value)}
                      placeholder="활동을 되돌아보며 부족했던 점이나 다음에 더 보완하고 싶은 점을 솔직하게 적으세요."
                      className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                    />
                  </div>

                  {/* 4-3 Future Plans */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-[#2D3748]">
                        향후 심화 탐구 및 후속 발전 계획
                      </label>
                      <span className="text-[11px] text-[#A0AEC0]">{stages.selfEvaluation.futurePlans?.length || 0}자</span>
                    </div>
                    <textarea
                      rows={3}
                      value={stages.selfEvaluation.futurePlans}
                      onChange={(e) => handleFieldChange('selfEvaluation', 'futurePlans', e.target.value)}
                      placeholder="이 탐구를 바탕으로 다음 학기나 진로와 연계하여 더 깊이 연구해보고 싶은 주제가 있다면 적으세요."
                      className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] leading-relaxed focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File Attachments Section (자료 첨부 기능) */}
        <div className="bg-white rounded-2xl border-2 border-[#EAEAE2] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F2EB] pb-3">
            <div className="flex items-center space-x-2">
              <Paperclip className="w-5 h-5 text-[#7A9070]" />
              <h3 className="text-base font-bold text-[#2D3748]">
                학습 및 산출물 자료 첨부 ({attachments.length}개)
              </h3>
            </div>
            <span className="text-xs text-[#718096]">
              최대 20MB (영상, 이미지, PDF, HWP, ZIP 등)
            </span>
          </div>

          {/* Drag & Drop Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files) {
                handleFileUpload(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#7A9070] bg-[#EAF0E8]'
                : 'border-[#D9DEC9] bg-[#F9F9F6] hover:border-[#7A9070] hover:bg-[#F4F5EE]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleFileUpload(e.target.files);
                }
              }}
              className="hidden"
            />
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9DEC9] flex items-center justify-center mx-auto text-[#7A9070] shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#2D3748]">
                  {isUploading ? '파일을 서버로 업로드하고 있습니다...' : '파일을 여기로 드래그하거나 클릭하여 업로드하세요'}
                </p>
                <p className="text-[11px] text-[#718096] mt-1">
                  시제품 영상(MP4), 실험 사진(JPG/PNG), 보고서(HWP/HWPX/PDF), 압축파일(ZIP) 등 최대 20MB
                </p>
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="p-3 bg-[#FFF5F5] border border-[#FEB2B2] rounded-xl text-xs text-[#C53030] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div className="space-y-3 pt-2">
              {attachments.map((att, idx) => (
                <div
                  key={att.id || idx}
                  className="bg-[#F9F9F6] p-4 rounded-xl border border-[#EAEAE2] space-y-3"
                >
                  {/* File Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#D9DEC9] text-[#7A9070] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-[#2D3748] truncate">
                          {att.originalName}
                        </p>
                        <p className="text-[10px] text-[#718096]">
                          {formatBytes(att.size)} • {formatDate(att.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {att.url && (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] font-bold text-[#7A9070] bg-white border border-[#D9DEC9] hover:bg-[#EAF0E8] rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>열기</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1.5 text-[#E53E3E] hover:bg-[#FED7D7] rounded-lg transition-colors"
                        title="파일 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inputs for Title and Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-[#4A5568] mb-1">
                        자료 제목 <span className="text-[#C53030]">*</span>
                      </label>
                      <input
                        type="text"
                        value={att.title}
                        onChange={(e) => handleAttachmentChange(att.id, 'title', e.target.value)}
                        placeholder="예: 최종 시제품 구동 영상"
                        className="w-full px-3 py-1.5 bg-white border border-[#D9DEC9] rounded-lg text-xs text-[#2D3748] focus:outline-none focus:border-[#7A9070]"
                      />
                    </div>
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-bold text-[#4A5568] mb-1">
                        핵심 내용 요약 (AI 세특 생성 시 반영)
                      </label>
                      <input
                        type="text"
                        value={att.summary}
                        onChange={(e) => handleAttachmentChange(att.id, 'summary', e.target.value)}
                        placeholder="예: 컨베이어 벨트에서 페트병을 광학 센서로 감지하여 캔과 분류하는 30초 데모 영상"
                        className="w-full px-3 py-1.5 bg-white border border-[#D9DEC9] rounded-lg text-xs text-[#2D3748] focus:outline-none focus:border-[#7A9070]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAEAE2] p-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Progress gauge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF0E8] text-[#486341] flex items-center justify-center font-bold text-xs">
              {completionPercentage}%
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D3748]">
                포트폴리오 작성 진행률: {completedCount}/4 단계
              </p>
              <p className="text-[11px] text-[#718096]">
                {completedCount === 4 ? '모든 4단계를 완료했습니다!' : `${4 - completedCount}개 단계가 더 남았습니다.`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-[#7A9070] hover:bg-[#687D5F] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              {isSaving ? (
                <span>저장 중...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>포트폴리오 저장하기</span>
                  <span className="hidden sm:inline text-[11px] font-normal opacity-80">(Ctrl+S)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
