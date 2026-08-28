import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Save, 
  RefreshCw, 
  Layers, 
  Paperclip, 
  FileText, 
  AlertCircle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  Wand2,
  BookOpen
} from 'lucide-react';
import type { ClassRoom, StudentRecord, AiDraft } from '../types';
import { saveStudentAiDraft } from '../firebase';
import { getNeisByteCount, formatBytes } from '../utils/formatters';

interface AiSetukModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  room: ClassRoom;
  onDraftSaved?: (updatedStudent: StudentRecord) => void;
}

export const AiSetukModal: React.FC<AiSetukModalProps> = ({
  isOpen,
  onClose,
  student,
  room,
  onDraftSaved,
}) => {
  const [tone, setTone] = useState<'competency' | 'creativity' | 'growth' | 'collaboration'>(
    student.aiDraft?.tone || 'competency'
  );
  const [targetLength, setTargetLength] = useState('500');
  const [customPrompt, setCustomPrompt] = useState('');
  
  const [draftContent, setDraftContent] = useState(student.aiDraft?.content || '');
  const [teacherNotes, setTeacherNotes] = useState(student.aiDraft?.teacherNotes || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'review' | 'attachments'>('review');

  useEffect(() => {
    if (student.aiDraft) {
      setDraftContent(student.aiDraft.content || '');
      setTeacherNotes(student.aiDraft.teacherNotes || '');
      if (student.aiDraft.tone) setTone(student.aiDraft.tone);
    } else {
      setDraftContent('');
      setTeacherNotes('');
    }
  }, [student]);

  if (!isOpen) return null;

  const currentNeisBytes = getNeisByteCount(draftContent);
  const currentChars = draftContent.length;
  const maxNeisBytes = 1500; // Standard 500 korean char limit (3 bytes * 500)
  const bytePercentage = Math.min(100, Math.round((currentNeisBytes / maxNeisBytes) * 100));

  const handleGenerateAiSetuk = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage('');

      const res = await fetch('/api/gemini/generate-setuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          room,
          options: {
            tone,
            targetLength,
            customPrompt,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'AI 세특 생성 요청에 실패했습니다.');
      }

      const data = await res.json();
      setDraftContent(data.draft);

      // Auto save draft to Firestore
      const newDraft: AiDraft = {
        content: data.draft,
        tone,
        generatedAt: data.generatedAt,
        charCount: data.charCount,
        byteCount: data.byteCount,
        teacherNotes,
        customPrompt,
      };

      await saveStudentAiDraft(room.id, student.id, newDraft);
      if (onDraftSaved) {
        onDraftSaved({
          ...student,
          aiDraft: newDraft,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gemini API 호출 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setErrorMessage('');

      const newDraft: AiDraft = {
        content: draftContent,
        tone,
        generatedAt: student.aiDraft?.generatedAt || new Date().toISOString(),
        charCount: draftContent.length,
        byteCount: getNeisByteCount(draftContent),
        teacherNotes,
        customPrompt,
      };

      await saveStudentAiDraft(room.id, student.id, newDraft);
      if (onDraftSaved) {
        onDraftSaved({
          ...student,
          aiDraft: newDraft,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[92vh] shadow-2xl border border-[#EAEAE2] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-[#EAEAE2] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF0E8] text-[#486341] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-[#2D3748]">
                  {student.studentNumber} {student.studentName} 학생 AI 세특 생성기
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F4F5EE] text-[#5B6F52] border border-[#D9DEC9] font-mono">
                  {student.completedStageCount}/4 단계 작성됨
                </span>
              </div>
              <p className="text-xs text-[#718096]">
                {room.title} ({room.subject})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#718096] hover:bg-[#F4F5EE] hover:text-[#2D3748]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-[#FFF5F5] border border-[#FEB2B2] rounded-xl flex items-center space-x-2 text-xs text-[#C53030]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main 2-Column Split Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Student Submitted Portfolio Review (5 cols) */}
          <div className="lg:col-span-5 border-r border-[#EAEAE2] flex flex-col bg-[#F9F9F6] overflow-hidden">
            {/* Tab switch */}
            <div className="flex items-center border-b border-[#EAEAE2] bg-white px-4">
              <button
                onClick={() => setActiveTab('review')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'review'
                    ? 'border-[#7A9070] text-[#486341]'
                    : 'border-transparent text-[#718096] hover:text-[#2D3748]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>4단계 포트폴리오</span>
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'attachments'
                    ? 'border-[#7A9070] text-[#486341]'
                    : 'border-transparent text-[#718096] hover:text-[#2D3748]'
                }`}
              >
                <Paperclip className="w-4 h-4" />
                <span>첨부자료 ({student.attachments?.length || 0})</span>
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'review' ? (
                <>
                  {/* Stage 1: Exploration */}
                  <div className="bg-white p-4 rounded-xl border border-[#EAEAE2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#486341] flex items-center space-x-1">
                        <span className="w-4 h-4 rounded-full bg-[#EAF0E8] text-[#486341] flex items-center justify-center text-[10px]">1</span>
                        <span>탐구 (Exploration)</span>
                      </span>
                    </div>
                    <div className="text-xs text-[#2D3748] space-y-1.5">
                      <p><strong className="text-[#718096]">주제:</strong> {student.stages?.exploration?.topic || '-'}</p>
                      <p><strong className="text-[#718096]">동기:</strong> {student.stages?.exploration?.motivation || '-'}</p>
                      <p><strong className="text-[#718096]">핵심 질문/가설:</strong> {student.stages?.exploration?.question || '-'}</p>
                      <p><strong className="text-[#718096]">선행조사/배경:</strong> {student.stages?.exploration?.backgroundResearch || '-'}</p>
                    </div>
                  </div>

                  {/* Stage 2: Design */}
                  <div className="bg-white p-4 rounded-xl border border-[#EAEAE2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#486341] flex items-center space-x-1">
                        <span className="w-4 h-4 rounded-full bg-[#EAF0E8] text-[#486341] flex items-center justify-center text-[10px]">2</span>
                        <span>설계 (Design)</span>
                      </span>
                    </div>
                    <div className="text-xs text-[#2D3748] space-y-1.5">
                      <p><strong className="text-[#718096]">수행 계획:</strong> {student.stages?.design?.plan || '-'}</p>
                      <p><strong className="text-[#718096]">역할/협력:</strong> {student.stages?.design?.roles || '-'}</p>
                      <p><strong className="text-[#718096]">도구/기술:</strong> {student.stages?.design?.toolsAndTech || '-'}</p>
                      <p><strong className="text-[#718096]">설계/알고리즘:</strong> {student.stages?.design?.processDesign || '-'}</p>
                    </div>
                  </div>

                  {/* Stage 3: Outcome & Reflection */}
                  <div className="bg-white p-4 rounded-xl border border-[#EAEAE2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#486341] flex items-center space-x-1">
                        <span className="w-4 h-4 rounded-full bg-[#EAF0E8] text-[#486341] flex items-center justify-center text-[10px]">3</span>
                        <span>산출 / 성찰 (Outcome)</span>
                      </span>
                    </div>
                    <div className="text-xs text-[#2D3748] space-y-1.5">
                      <p><strong className="text-[#718096]">산출물 결과:</strong> {student.stages?.outcome?.finalResult || '-'}</p>
                      <p><strong className="text-[#718096]">문제 해결/오류 극복:</strong> {student.stages?.outcome?.problemSolving || '-'}</p>
                      <p><strong className="text-[#718096]">배운 점/성찰:</strong> {student.stages?.outcome?.insights || '-'}</p>
                    </div>
                  </div>

                  {/* Stage 4: Self Evaluation */}
                  <div className="bg-white p-4 rounded-xl border border-[#EAEAE2] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#486341] flex items-center space-x-1">
                        <span className="w-4 h-4 rounded-full bg-[#EAF0E8] text-[#486341] flex items-center justify-center text-[10px]">4</span>
                        <span>자기평가 (Self-Eval)</span>
                      </span>
                    </div>
                    <div className="text-xs text-[#2D3748] space-y-1.5">
                      <p><strong className="text-[#718096]">역량 성장:</strong> {student.stages?.selfEvaluation?.competencyGrowth || '-'}</p>
                      <p><strong className="text-[#718096]">자기 성찰:</strong> {student.stages?.selfEvaluation?.reflection || '-'}</p>
                      <p><strong className="text-[#718096]">후속 발전 계획:</strong> {student.stages?.selfEvaluation?.futurePlans || '-'}</p>
                    </div>
                  </div>
                </>
              ) : (
                /* Attachments Tab */
                <div className="space-y-3">
                  {(!student.attachments || student.attachments.length === 0) ? (
                    <div className="text-center py-8 text-xs text-[#A0AEC0]">
                      첨부된 자료가 없습니다.
                    </div>
                  ) : (
                    student.attachments.map((att, idx) => (
                      <div key={att.id || idx} className="bg-white p-3.5 rounded-xl border border-[#EAEAE2] space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-[#7A9070] shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-[#2D3748] truncate max-w-[200px]">
                                {att.title || att.originalName}
                              </p>
                              <p className="text-[10px] text-[#718096]">
                                {att.originalName} ({formatBytes(att.size)})
                              </p>
                            </div>
                          </div>
                          {att.url && (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-[#7A9070] hover:bg-[#EAF0E8] rounded-lg text-xs flex items-center space-x-0.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="text-[11px]">열기</span>
                            </a>
                          )}
                        </div>
                        {att.summary && (
                          <div className="p-2 bg-[#F9F9F6] rounded-lg text-[11px] text-[#4A5568] leading-relaxed">
                            <span className="font-semibold text-[#718096] mr-1">학생 요약:</span>
                            {att.summary}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Generator & Setuk Editor (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-white overflow-hidden">
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
              {/* Achievement Standard Reference Pill */}
              <div className="p-3 bg-[#F4F7F2] rounded-xl border border-[#C6D4C2] text-xs">
                <div className="flex items-center space-x-1.5 text-[#3F4F39] font-bold mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#7A9070]" />
                  <span>연계 교육과정 성취기준</span>
                </div>
                <p className="text-[#52634B] text-[11px] leading-relaxed line-clamp-2">
                  {room.achievementStandards}
                </p>
              </div>

              {/* Generation Controls */}
              <div className="bg-[#F9F9F6] p-4 rounded-xl border border-[#EAEAE2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D3748] flex items-center space-x-1">
                    <Wand2 className="w-3.5 h-3.5 text-[#7A9070]" />
                    <span>세특 작성 스타일 및 옵션</span>
                  </span>
                  <div className="flex items-center space-x-1 text-xs">
                    <span className="text-[#718096] text-[11px]">분량:</span>
                    <select
                      value={targetLength}
                      onChange={(e) => setTargetLength(e.target.value)}
                      className="text-xs bg-white border border-[#D9DEC9] rounded-lg px-2 py-1 text-[#2D3748] font-medium"
                    >
                      <option value="350">350자 (간결형)</option>
                      <option value="500">500자 (NEIS 권장)</option>
                      <option value="700">700자 (심화형)</option>
                    </select>
                  </div>
                </div>

                {/* Tone Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'competency', label: '교과역량 중심' },
                    { id: 'creativity', label: '창의·오류극복' },
                    { id: 'growth', label: '자기주도 성장' },
                    { id: 'collaboration', label: '협력·나눔' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id as any)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                        tone === t.id
                          ? 'bg-[#7A9070] text-white border-[#7A9070] shadow-2xs'
                          : 'bg-white text-[#4A5568] border-[#D9DEC9] hover:bg-[#EAF0E8]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Custom Instruction input */}
                <div>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="교사 추가 지시사항 (예: 3단계 알고리즘 오류 수정 과정을 더 구체적으로 서술)"
                    className="w-full px-3 py-2 bg-white border border-[#D9DEC9] rounded-xl text-xs text-[#2D3748] placeholder-[#A0AEC0] focus:outline-none focus:border-[#7A9070]"
                  />
                </div>

                {/* Big Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerateAiSetuk}
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-[#7A9070] hover:bg-[#687D5F] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini가 포트폴리오를 분석하여 세특 초안을 작성 중입니다...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Gemini AI 세특 초안 {draftContent ? '다시 생성하기' : '생성하기'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Draft Textarea & NEIS Byte Counter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2D3748] flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#7A9070]" />
                    <span>생활기록부 세특 최종 문안 (직접 수정 가능)</span>
                  </label>
                  
                  {/* NEIS Byte and Char Counter */}
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="text-[#718096]">{currentChars}자</span>
                    <span className="text-[#CBD5E0]">|</span>
                    <span className={`font-bold ${currentNeisBytes > maxNeisBytes ? 'text-[#E53E3E]' : 'text-[#486341]'}`}>
                      {currentNeisBytes.toLocaleString()} / {maxNeisBytes.toLocaleString()} Bytes
                    </span>
                  </div>
                </div>

                {/* Byte Progress Bar */}
                <div className="w-full bg-[#EAEAE2] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      currentNeisBytes > maxNeisBytes 
                        ? 'bg-[#E53E3E]' 
                        : bytePercentage > 85 
                        ? 'bg-[#D69E2E]' 
                        : 'bg-[#7A9070]'
                    }`}
                    style={{ width: `${Math.min(100, bytePercentage)}%` }}
                  />
                </div>

                <textarea
                  rows={8}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="위의 [AI 세특 초안 생성하기] 버튼을 누르면 학생의 포트폴리오와 성취기준을 종합한 세특 문안이 여기에 생성됩니다. 교사가 자유롭게 첨삭할 수 있습니다."
                  className="w-full p-3.5 bg-white border border-[#D9DEC9] rounded-2xl text-xs sm:text-sm text-[#2D3748] leading-relaxed font-sans focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20 resize-y min-h-[160px]"
                />
              </div>

              {/* Teacher Memo */}
              <div>
                <label className="block text-xs font-bold text-[#718096] mb-1">
                  교사 개별 메모 / 지도 소견 (생기부 미반영)
                </label>
                <input
                  type="text"
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  placeholder="예: 2학기 동아리 발표회 연계 지도 예정"
                  className="w-full px-3 py-2 bg-[#F9F9F6] border border-[#EAEAE2] rounded-xl text-xs text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070]"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-[#F9F9F6] border-t border-[#EAEAE2] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!draftContent}
                  className="px-4 py-2 bg-white border border-[#D9DEC9] hover:bg-[#F4F5EE] disabled:opacity-40 text-[#2D3748] text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-[#38A169]" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'NEIS 복사 완료!' : 'NEIS용 텍스트 복사'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {saveSuccess && (
                  <span className="text-xs text-[#38A169] font-bold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>저장 완료</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving || !draftContent}
                  className="px-5 py-2 bg-[#7A9070] hover:bg-[#687D5F] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? '저장 중...' : '포트폴리오에 저장'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
