import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  BookOpen, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  QrCode, 
  Copy, 
  Check, 
  Search,
  ExternalLink,
  GraduationCap,
  FolderOpen
} from 'lucide-react';
import type { ClassRoom } from '../types';
import { subscribeRooms, createClassRoom, getOrCreateStudentRecord } from '../firebase';
import { ACHIEVEMENT_TEMPLATES } from '../data/achievementTemplates';
import { CreateRoomModal } from './CreateRoomModal';

interface TeacherDashboardProps {
  onSelectRoom: (room: ClassRoom) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onSelectRoom,
}) => {
  const [rooms, setRooms] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Subscribe to real-time rooms
  useEffect(() => {
    const unsubscribe = subscribeRooms((data) => {
      setRooms(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredRooms = rooms.filter((r) => {
    return (
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Helper to create a rich demo room for instant testing
  const handleCreateSampleDemoRoom = async () => {
    try {
      setIsSeeding(true);
      const demoCode = `tech${Math.floor(Math.random() * 89 + 10)}`;
      const sampleRoom = await createClassRoom({
        roomCode: demoCode,
        title: '2026 인공지능과 피지컬컴퓨팅 실생활 문제해결',
        subject: '정보 / AI',
        grade: '고등학교 2학년',
        description: '생활 속 불편함을 해결하는 인공지능 영상인식 기반 스마트 재활용 분리수거 로봇 설계 및 구현 프로젝트',
        achievementStandards: ACHIEVEMENT_TEMPLATES[0].standard,
        teacherName: '김정보 선생님',
      });

      // Add a couple of realistic demo students
      const std1 = await getOrCreateStudentRecord(demoCode, '20412', '김하늘');
      std1.stages.exploration = {
        topic: '컴퓨터 비전 기반 스마트 재활용 분리수거 분류기 설계',
        motivation: '교내 쓰레기 분리수거장에서 플라스틱과 캔이 혼합 배출되어 자원 낭비가 심각한 문제를 관찰하고 자동 분류 시스템의 필요성을 절감함.',
        question: 'CNN 이미지 분류 모델과 웹캠을 연동하여 실시간으로 쓰레기 재질을 90% 이상의 정확도로 판별할 수 있는가?',
        backgroundResearch: 'Teachable Machine 및 YOLOv8 모델 구조 조사, 폐기물 이미지 데이터셋(AI Hub) 분석 및 전처리 기법 탐색.',
      };
      std1.stages.design = {
        plan: '1주차: 데이터 수집 및 라벨링, 2주차: 모델 학습 및 하이퍼파라미터 튜닝, 3주차: 아두이노 서보모터 기구부 제작, 4주차: 통합 테스트.',
        roles: '팀장으로서 모델 학습 파이프라인 구축 및 아두이노 시리얼 통신 연동 프로그래밍 총괄.',
        toolsAndTech: 'Python, OpenCV, TensorFlow/Keras, Arduino UNO, 서보모터(SG90), 웹캠.',
        processDesign: '웹캠 영상 캡처 -> OpenCV ROI 추출 -> 정규화 -> 분류 모델 추론 -> Serial 통신 -> 서보모터 각도 제어로 해당 수거함 개폐.',
      };
      std1.stages.outcome = {
        finalResult: '투명 페트병, 유색 플라스틱, 알루미늄 캔 3종을 실시간 94.2% 정확도로 분류하고 서보모터로 자동 분류 적재하는 시제품 완성.',
        problemSolving: '초기 조명 반사로 인해 투명 페트병 인식률이 65%로 저조했으나, 데이터 증강(Data Augmentation - 밝기 및 대비 변환) 기법을 적용하여 94%까지 대폭 개선함.',
        insights: '단순한 모델 학습을 넘어 실제 하드웨어 센서와의 실시간 인터페이스 제어에서 발생하는 지연 시간과 물리적 오류를 고려하는 임베디드 AI 역량을 체득함.',
      };
      std1.stages.selfEvaluation = {
        competencyGrowth: '공학적 문제해결력과 알고리즘 최적화 역량이 비약적으로 성장하였으며, 팀원 간의 의견 충돌 시 데이터 기반 성능 평가표를 제시하여 원활한 소통을 이끔.',
        reflection: '유리병이나 구겨진 캔 등 비정형 외형에 대한 인식 성능이 다소 떨어져 추후 멀티모달 센서(초음파 및 중량 센서) 융합의 필요성을 느낌.',
        futurePlans: '엣지 컴퓨팅(Raspberry Pi) 환경으로 이식하여 경량화 모델(MobileNet) 변환 연구를 지속할 계획임.',
      };
      std1.attachments = [
        {
          id: 'sample_doc1',
          originalName: '스마트분리수거_결과보고서.pdf',
          url: 'https://example.com/sample.pdf',
          size: 2450000,
          mimeType: 'application/pdf',
          title: '스마트 재활용 분리수거 장치 최종 탐구 보고서',
          summary: '실험 설계, 데이터셋 구성표, 회로도 및 OpenCV 연동 파이썬 소스코드가 포함된 최종 산출물 보고서',
          uploadedAt: new Date().toISOString(),
        }
      ];

      // Save student 1
      const { saveStudentRecord } = await import('../firebase');
      await saveStudentRecord(demoCode, std1.id, std1.stages, std1.attachments);

      // Select newly created room
      onSelectRoom(sampleRoom);
    } catch (err: any) {
      alert(err.message || '샘플 방 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAEAE2] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#486341] uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-[#7A9070]" />
            <span>교사용 수업 관리 대시보드</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748] tracking-tight">
            프로젝트 수업 및 세특 관리
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            개설된 수업 방을 선택해 학생들의 포트폴리오를 실시간 모니터링하고 AI 세특 초안을 생성하세요.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {rooms.length === 0 && (
            <button
              onClick={handleCreateSampleDemoRoom}
              disabled={isSeeding}
              className="px-4 py-2.5 bg-[#F4F5EE] hover:bg-[#EAEAE2] text-[#3F4F39] text-xs font-bold rounded-xl transition-colors border border-[#D9DEC9] flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 text-[#7A9070]" />
              <span>{isSeeding ? '샘플 방 생성 중...' : '체험용 샘플 방 자동 생성'}</span>
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-[#7A9070] hover:bg-[#687D5F] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>새 프로젝트 방 만들기</span>
          </button>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-[#A0AEC0] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="수업명, 방 코드, 과목명 검색..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D9DEC9] rounded-xl text-xs sm:text-sm text-[#2D3748] focus:outline-none focus:border-[#7A9070] focus:ring-2 focus:ring-[#7A9070]/20"
          />
        </div>

        <div className="text-xs text-[#718096] flex items-center space-x-4">
          <span>총 <strong>{rooms.length}</strong>개 개설됨</span>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#718096]">
          수업 방 목록을 불러오는 중입니다...
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-[#D9DEC9] p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#EAF0E8] text-[#486341] flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2D3748]">개설된 프로젝트 수업 방이 없습니다</h3>
            <p className="text-xs text-[#718096] mt-1 max-w-sm mx-auto">
              [새 프로젝트 방 만들기] 버튼을 눌러 학생들에게 공유할 방 코드와 성취기준을 설정해보세요.
            </p>
          </div>
          <div className="pt-2 flex justify-center space-x-3">
            <button
              onClick={handleCreateSampleDemoRoom}
              disabled={isSeeding}
              className="px-4 py-2 bg-[#F4F5EE] hover:bg-[#EAEAE2] text-[#3F4F39] text-xs font-bold rounded-xl transition-colors border border-[#D9DEC9]"
            >
              체험용 샘플 방 1초 생성
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#7A9070] hover:bg-[#687D5F] text-white text-xs font-bold rounded-xl transition-colors"
            >
              새 방 직접 만들기
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className="group bg-white rounded-2xl p-6 border-2 border-[#EAEAE2] hover:border-[#7A9070] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Room Header with Code Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#EAF0E8] text-[#486341] border border-[#C6D4C2] font-mono">
                    방 코드: {room.id}
                  </span>
                  <span className="text-[11px] font-semibold text-[#718096] bg-[#F4F5EE] px-2 py-0.5 rounded">
                    {room.grade || '전체'}
                  </span>
                </div>

                {/* Title and Subject */}
                <div>
                  <span className="text-xs font-bold text-[#7A9070] block mb-1">
                    {room.subject}
                  </span>
                  <h3 className="text-base font-bold text-[#2D3748] group-hover:text-[#486341] transition-colors line-clamp-2">
                    {room.title}
                  </h3>
                  {room.description && (
                    <p className="text-xs text-[#718096] mt-1.5 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>
                  )}
                </div>

                {/* Achievement standard teaser */}
                <div className="bg-[#F9F9F6] p-3 rounded-xl border border-[#EAEAE2] text-[11px] text-[#52634B] space-y-1">
                  <span className="font-bold text-[#3F4F39] flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#7A9070]" />
                    <span>성취기준</span>
                  </span>
                  <p className="line-clamp-2 leading-relaxed text-[#718096]">
                    {room.achievementStandards}
                  </p>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-6 pt-4 border-t border-[#F0F2EB] flex items-center justify-between text-xs font-bold text-[#486341]">
                <span>학생 명단 및 세특 관리</span>
                <div className="w-7 h-7 rounded-full bg-[#EAF0E8] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={(newRoom) => {
          onSelectRoom(newRoom);
        }}
      />
    </div>
  );
};
