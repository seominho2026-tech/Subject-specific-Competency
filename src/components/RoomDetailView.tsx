import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  QrCode, 
  Copy, 
  Check, 
  Sparkles, 
  Search, 
  Filter, 
  Users, 
  Layers, 
  Paperclip, 
  FileText, 
  BookOpen, 
  Download, 
  ExternalLink,
  ChevronRight,
  Maximize2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ClassRoom, StudentRecord } from '../types';
import { subscribeRoomStudents, saveStudentRecord } from '../firebase';
import { formatDate } from '../utils/formatters';
import { QrModal } from './QrModal';
import { AiSetukModal } from './AiSetukModal';

interface RoomDetailViewProps {
  room: ClassRoom;
  onBack: () => void;
}

export const RoomDetailView: React.FC<RoomDetailViewProps> = ({
  room,
  onBack,
}) => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgress, setFilterProgress] = useState<'all' | 'completed' | 'in_progress' | 'has_ai'>('all');
  
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedStudentForAi, setSelectedStudentForAi] = useState<StudentRecord | null>(null);
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to real-time students list in this room
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeRoomStudents(room.id, (data) => {
      setStudents(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [room.id]);

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${encodeURIComponent(room.id)}`
    : `https://school-portfolio.app/?room=${room.id}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filter students based on search and progress
  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterProgress === 'completed') {
      return s.completedStageCount === 4;
    }
    if (filterProgress === 'in_progress') {
      return s.completedStageCount < 4;
    }
    if (filterProgress === 'has_ai') {
      return !!s.aiDraft?.content;
    }
    return true;
  });

  // Calculate statistics
  const totalStudents = students.length;
  const fullyCompleted = students.filter((s) => s.completedStageCount === 4).length;
  const withAiDraft = students.filter((s) => !!s.aiDraft?.content).length;
  const totalAttachments = students.reduce((acc, s) => acc + (s.attachments?.length || 0), 0);

  // Export full class data to CSV (for Excel / NEIS bulk archive)
  const handleExportCsv = () => {
    if (students.length === 0) return;
    
    const headers = [
      '학번', 
      '이름', 
      '완료단계수(0~4)', 
      '1_탐구_주제', 
      '1_탐구_동기',
      '2_설계_계획', 
      '2_설계_도구기술',
      '3_산출_결과', 
      '3_산출_오류해결',
      '4_자기평가_성장', 
      '첨부파일수', 
      'AI_세특_초안', 
      '교사메모'
    ];

    const rows = students.map((s) => [
      `"${s.studentNumber}"`,
      `"${s.studentName}"`,
      s.completedStageCount,
      `"${(s.stages?.exploration?.topic || '').replace(/"/g, '""')}"`,
      `"${(s.stages?.exploration?.motivation || '').replace(/"/g, '""')}"`,
      `"${(s.stages?.design?.plan || '').replace(/"/g, '""')}"`,
      `"${(s.stages?.design?.toolsAndTech || '').replace(/"/g, '""')}"`,
      `"${(s.stages?.outcome?.finalResult || '').replace(/"/g, '""')}"`,
      `"${(s.stages?.outcome?.problemSolving || '').replace(/"/g, '""')}"`,
      `"${(s.stages?.selfEvaluation?.competencyGrowth || '').replace(/"/g, '""')}"`,
      s.attachments?.length || 0,
      `"${(s.aiDraft?.content || '').replace(/"/g, '""')}"`,
      `"${(s.aiDraft?.teacherNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${room.id}_${room.title}_세특포트폴리오_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-[#EAEAE2] text-[#4A5568] hover:bg-[#F4F5EE] hover:text-[#2D3748] transition-colors shadow-2xs"
            title="대시보드로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#2D3748]">
                {room.title}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF0E8] text-[#486341] font-bold border border-[#C6D4C2]">
                {room.subject}
              </span>
            </div>
            <p className="text-xs text-[#718096]">
              {room.grade} • 담당: {room.teacherName || '선생님'}
            </p>
          </div>
        </div>

        {/* Quick CSV Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            disabled={students.length === 0}
            className="px-3.5 py-2 bg-white border border-[#D9DEC9] hover:bg-[#F4F5EE] disabled:opacity-40 text-[#2D3748] text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-[#7A9070]" />
            <span>엑셀/CSV 다운로드</span>
          </button>
        </div>
      </div>

      {/* Entry Guidance Card (QR Code, Room Code, Link Copy) */}
      <div className="bg-white rounded-2xl border-2 border-[#D9DEC9] p-5 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Huge Room Code Info (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#5B6F52] bg-[#F4F5EE] px-2.5 py-1 rounded-lg border border-[#E2E4D8]">
                학생 입장 안내
              </span>
              <span className="text-xs text-[#718096]">수업 시간에 학생들에게 보여주세요</span>
            </div>

            <div className="bg-[#F9F9F6] border-2 border-dashed border-[#7A9070] rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#718096] uppercase">입장 방 코드</p>
                <p className="text-3xl font-black text-[#2D3748] font-mono tracking-wider">
                  {room.id}
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-white border border-[#D9DEC9] hover:border-[#7A9070] text-[#2D3748] text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-[#38A169]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '복사됨' : '코드 복사'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-[#7A9070] hover:bg-[#687D5F] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '학생 링크 복사 완료' : '학생 전용 입장 링크 복사'}</span>
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                className="px-3.5 py-2 bg-[#F4F5EE] hover:bg-[#EAEAE2] text-[#3F4F39] text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 border border-[#D9DEC9]"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>프로젝터 전체화면 QR</span>
              </button>
            </div>
          </div>

          {/* Center: Interactive QR Preview (3 cols) */}
          <div className="lg:col-span-3 flex items-center justify-center lg:border-x border-[#EAEAE2] lg:px-4 py-2">
            <div 
              onClick={() => setShowQrModal(true)}
              className="p-2.5 bg-white rounded-xl shadow-xs border border-[#D9DEC9] cursor-pointer hover:scale-105 transition-transform flex flex-col items-center"
              title="클릭하여 크게 보기"
            >
              <QRCodeSVG value={joinUrl} size={100} level="M" fgColor="#2D3748" bgColor="#FFFFFF" />
              <span className="text-[10px] font-bold text-[#7A9070] mt-1.5 flex items-center space-x-1">
                <QrCode className="w-3 h-3" />
                <span>QR 확대보기</span>
              </span>
            </div>
          </div>

          {/* Right: Quick Stats & Achievement Standard (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F9F9F6] p-2.5 rounded-xl border border-[#EAEAE2]">
                <p className="text-[11px] text-[#718096]">접속 학생</p>
                <p className="text-lg font-extrabold text-[#2D3748]">{totalStudents}명</p>
              </div>
              <div className="bg-[#F9F9F6] p-2.5 rounded-xl border border-[#EAEAE2]">
                <p className="text-[11px] text-[#718096]">4단계 완료</p>
                <p className="text-lg font-extrabold text-[#486341]">{fullyCompleted}명</p>
              </div>
              <div className="bg-[#F9F9F6] p-2.5 rounded-xl border border-[#EAEAE2]">
                <p className="text-[11px] text-[#718096]">세특 생성</p>
                <p className="text-lg font-extrabold text-[#7A9070]">{withAiDraft}명</p>
              </div>
            </div>

            {/* Achievement standard glance */}
            <div className="bg-[#F4F7F2] p-2.5 rounded-xl border border-[#C6D4C2] text-xs">
              <div className="flex items-center space-x-1 text-[#3F4F39] font-bold mb-0.5">
                <BookOpen className="w-3.5 h-3.5 text-[#7A9070]" />
                <span>연계 성취기준</span>
              </div>
              <p className="text-[11px] text-[#52634B] line-clamp-2 leading-tight">
                {room.achievementStandards}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Roster Section */}
      <div className="space-y-4">
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-[#2D3748] flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#7A9070]" />
              <span>학생 포트폴리오 현황 ({filteredStudents.length}명)</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="bg-[#F4F5EE] p-1 rounded-xl flex items-center space-x-1 border border-[#E2E4D8] text-xs">
              <button
                onClick={() => setFilterProgress('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterProgress === 'all' ? 'bg-white text-[#2D3748] shadow-2xs' : 'text-[#718096] hover:text-[#2D3748]'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterProgress('in_progress')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterProgress === 'in_progress' ? 'bg-white text-[#2D3748] shadow-2xs' : 'text-[#718096] hover:text-[#2D3748]'
                }`}
              >
                작성 중
              </button>
              <button
                onClick={() => setFilterProgress('completed')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterProgress === 'completed' ? 'bg-white text-[#2D3748] shadow-2xs' : 'text-[#718096] hover:text-[#2D3748]'
                }`}
              >
                4단계 완료
              </button>
              <button
                onClick={() => setFilterProgress('has_ai')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterProgress === 'has_ai' ? 'bg-white text-[#2D3748] shadow-2xs' : 'text-[#718096] hover:text-[#2D3748]'
                }`}
              >
                세특 생성됨
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#A0AEC0] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="학번 또는 이름 검색"
                className="pl-9 pr-3 py-1.5 bg-white border border-[#D9DEC9] rounded-xl text-xs text-[#2D3748] focus:outline-none focus:border-[#7A9070] w-40 sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* Student Table / Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#EAEAE2] p-12 text-center text-xs text-[#718096]">
            학생 명단을 불러오는 중입니다...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAEAE2] p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-[#CBD5E0] mx-auto" />
            <h3 className="text-sm font-bold text-[#4A5568]">
              {students.length === 0 ? '아직 입장한 학생이 없습니다.' : '검색 조건에 맞는 학생이 없습니다.'}
            </h3>
            <p className="text-xs text-[#718096] max-w-md mx-auto">
              상단의 방 코드(<strong>{room.id}</strong>) 또는 QR 코드를 학생들에게 안내하여 접속하도록 해주세요.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EAEAE2] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#2D3748]">
                <thead className="bg-[#F9F9F6] border-b border-[#EAEAE2] text-[#718096] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">학번</th>
                    <th className="py-3.5 px-4">이름</th>
                    <th className="py-3.5 px-4">4단계 진행률</th>
                    <th className="py-3.5 px-4">첨부자료</th>
                    <th className="py-3.5 px-4">최근 수정</th>
                    <th className="py-3.5 px-4">AI 세특 상태</th>
                    <th className="py-3.5 px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2EB]">
                  {filteredStudents.map((student) => {
                    const isFullyCompleted = student.completedStageCount === 4;
                    const stageBadges = [
                      { label: '1.탐구', filled: !!student.stages?.exploration?.topic || !!student.stages?.exploration?.motivation },
                      { label: '2.설계', filled: !!student.stages?.design?.plan || !!student.stages?.design?.toolsAndTech },
                      { label: '3.산출', filled: !!student.stages?.outcome?.finalResult || !!student.stages?.outcome?.problemSolving },
                      { label: '4.평가', filled: !!student.stages?.selfEvaluation?.competencyGrowth || !!student.stages?.selfEvaluation?.reflection },
                    ];

                    return (
                      <tr 
                        key={student.id}
                        className="hover:bg-[#F9F9F6] transition-colors"
                      >
                        {/* Student Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[#4A5568]">
                          {student.studentNumber}
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-4 font-bold text-[#2D3748]">
                          {student.studentName}
                        </td>

                        {/* 4-Stage Progress */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-[#EAEAE2] h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isFullyCompleted ? 'bg-[#486341]' : 'bg-[#7A9070]'
                                  }`}
                                  style={{ width: `${(student.completedStageCount / 4) * 100}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-[#486341]">
                                {student.completedStageCount}/4
                              </span>
                            </div>

                            {/* Stage pill indicators */}
                            <div className="flex items-center space-x-1">
                              {stageBadges.map((b, idx) => (
                                <span
                                  key={idx}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                    b.filled
                                      ? 'bg-[#EAF0E8] text-[#3F4F39] border border-[#C6D4C2]'
                                      : 'bg-[#F4F5EE] text-[#A0AEC0]'
                                  }`}
                                >
                                  {b.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Attachments */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-[#718096]" />
                            <span className="font-semibold text-[#4A5568]">
                              {student.attachments?.length || 0}개
                            </span>
                          </div>
                        </td>

                        {/* Last Updated */}
                        <td className="py-3.5 px-4 text-[#718096]">
                          {formatDate(student.updatedAt)}
                        </td>

                        {/* AI Setuk Draft Status */}
                        <td className="py-3.5 px-4">
                          {student.aiDraft?.content ? (
                            <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#EAF0E8] text-[#3F4F39] text-[11px] font-bold border border-[#C6D4C2]">
                              <CheckCircle2 className="w-3 h-3 text-[#7A9070]" />
                              <span>{student.aiDraft.charCount || student.aiDraft.content.length}자 완료</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#A0AEC0] font-medium">
                              미생성
                            </span>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedStudentForAi(student)}
                            className="px-3 py-1.5 bg-[#7A9070] hover:bg-[#687D5F] text-white text-xs font-bold rounded-xl transition-all shadow-2xs inline-flex items-center space-x-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{student.aiDraft?.content ? '세특 확인/수정' : 'AI 세특 생성'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Projector Fullscreen QR Modal */}
      <QrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        roomCode={room.id}
        roomTitle={room.title}
        subject={room.subject}
        grade={room.grade}
      />

      {/* AI Setuk Modal */}
      {selectedStudentForAi && (
        <AiSetukModal
          isOpen={!!selectedStudentForAi}
          onClose={() => setSelectedStudentForAi(null)}
          student={selectedStudentForAi}
          room={room}
          onDraftSaved={(updatedStudent) => {
            setSelectedStudentForAi(updatedStudent);
          }}
        />
      )}
    </div>
  );
};
