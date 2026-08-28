import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  BookOpen, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Layers,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import { ACHIEVEMENT_TEMPLATES } from '../data/achievementTemplates';
import { createClassRoom } from '../firebase';
import type { ClassRoom } from '../types';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (newRoom: ClassRoom) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('정보');
  const [grade, setGrade] = useState('고등학교 2학년');
  const [description, setDescription] = useState('');
  const [achievementStandards, setAchievementStandards] = useState(
    ACHIEVEMENT_TEMPLATES[0].standard
  );
  const [teacherName, setTeacherName] = useState('김선생님');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleTemplateSelect = (standard: string, subj: string, grd: string) => {
    setAchievementStandards(standard);
    if (subj) setSubject(subj.split('/')[0].trim());
    if (grd) setGrade(grd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = roomCode.trim().toLowerCase();
    if (!cleanCode) {
      setErrorMessage('학생 입장용 방 코드를 입력해주세요.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]{2,20}$/.test(cleanCode)) {
      setErrorMessage('방 코드는 2~20자의 영문, 숫자, 하이픈(-), 밑줄(_)만 사용 가능합니다.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('프로젝트 수업명을 입력해주세요.');
      return;
    }
    if (!achievementStandards.trim()) {
      setErrorMessage('AI 세특 생성을 위한 교육과정 성취기준을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createClassRoom({
        roomCode: cleanCode,
        title,
        subject,
        grade,
        description,
        achievementStandards,
        teacherName,
      });
      onRoomCreated(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || '방 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EAEAE2] p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAEAE2] pb-4 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#EAF0E8] text-[#486341] flex items-center justify-center">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D3748]">새 프로젝트 수업 방 만들기</h3>
              <p className="text-xs text-[#718096]">학생들이 입장할 방 코드와 AI 세특 생성 성취기준을 설정합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#718096] hover:bg-[#F4F5EE] hover:text-[#2D3748]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-[#FFF5F5] border border-[#FEB2B2] rounded-xl flex items-start space-x-2 text-xs text-[#C53030]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Code & Teacher Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                학생 입장용 방 코드 <span className="text-[#C53030]">*</span>
                <span className="font-normal text-[#718096] ml-1">(영문/숫자 직접 지정)</span>
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="예: tech2, bio2026, ai_class"
                className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-sm font-mono text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
                required
              />
              <p className="text-[11px] text-[#718096] mt-1">학생들이 이 코드를 입력해 입장합니다. (중복 방지됨)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                담당 교사 성명
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="예: 김선생님"
                className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-sm text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
              />
            </div>
          </div>

          {/* Project Title */}
          <div>
            <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
              수업 / 프로젝트명 <span className="text-[#C53030]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026 1학기 인공지능과 피지컬컴퓨팅 실생활 문제해결 프로젝트"
              className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-sm text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
              required
            />
          </div>

          {/* Subject & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                교과목명
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="예: 정보, 과학탐구실험, 통합사회"
                className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-sm text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                대상 학년 / 학급
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="예: 고등학교 2학년, 1학년 3반"
                className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-sm text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
              수업 안내 및 과제 설명
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="학생들이 포트폴리오를 작성할 때 참고할 수 있도록 탐구 과제의 목표와 가이드를 적어주세요."
              className="w-full px-3.5 py-2.5 bg-[#F9F9F6] border border-[#D9DEC9] rounded-xl text-xs text-[#2D3748] focus:bg-white focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
            />
          </div>

          {/* Achievement Standards & Templates */}
          <div className="p-4 bg-[#F4F7F2] rounded-xl border border-[#C6D4C2] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3F4F39] flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#7A9070]" />
                <span>AI 세특 생성용 교육과정 성취기준 <span className="text-[#C53030]">*</span></span>
              </label>
              <span className="text-[11px] text-[#52634B]">표준 템플릿 선택 가능</span>
            </div>

            {/* Template selector chips */}
            <div className="flex flex-wrap gap-1.5">
              {ACHIEVEMENT_TEMPLATES.map((tmpl) => (
                <button
                  type="button"
                  key={tmpl.code}
                  onClick={() => handleTemplateSelect(tmpl.standard, tmpl.subject, tmpl.grade)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    achievementStandards === tmpl.standard
                      ? 'bg-[#7A9070] text-white border-[#7A9070] font-semibold'
                      : 'bg-white text-[#4A5568] border-[#D9DEC9] hover:bg-[#EAF0E8]'
                  }`}
                >
                  {tmpl.code} {tmpl.subject.split('/')[0]}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={achievementStandards}
              onChange={(e) => setAchievementStandards(e.target.value)}
              placeholder="예: [12정04-03] 실생활 및 다양한 학문 분야의 문제를 해결하기 위해 인공지능 알고리즘의 원리를 이해하고, 협력하여 소프트웨어를 설계하고 구현한다."
              className="w-full px-3.5 py-2.5 bg-white border border-[#D9DEC9] rounded-xl text-xs text-[#2D3748] leading-relaxed focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
              required
            />
            <p className="text-[11px] text-[#52634B]">
              💡 AI가 학생의 포트폴리오를 분석할 때 이 성취기준의 핵심 키워드와 교과 역량을 바탕으로 세특을 구성합니다.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-[#EAEAE2] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#718096] hover:bg-[#F4F5EE] rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#7A9070] hover:bg-[#687D5F] disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <span>방 생성 중...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>프로젝트 방 개설하기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
