import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  Smartphone, 
  KeyRound, 
  GraduationCap 
} from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomTitle: string;
  subject?: string;
  grade?: string;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  roomTitle,
  subject,
  grade,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const joinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?room=${encodeURIComponent(roomCode)}`
    : `https://school-portfolio.app/?room=${roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#EAEAE2] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top */}
        <div className="bg-[#7A9070] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-6 h-6" />
            <span className="font-bold text-base">수업 프로젝터 안내 화면</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-center">
          {/* Room Title */}
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAF0E8] text-[#486341] text-xs font-bold mb-2">
              <span>{subject || '수업'}</span>
              {grade && <span>• {grade}</span>}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D3748] tracking-tight">
              {roomTitle}
            </h2>
            <p className="text-sm text-[#718096] mt-1">스마트폰 카메라로 QR 코드를 비추거나 방 코드를 입력하세요.</p>
          </div>

          {/* Big Room Code Banner */}
          <div className="bg-[#F4F5EE] border-2 border-dashed border-[#7A9070] rounded-2xl p-4 sm:p-5 max-w-md mx-auto">
            <p className="text-xs font-bold text-[#5B6F52] tracking-wider uppercase mb-1">
              학생 입장용 방 코드
            </p>
            <div className="flex items-center justify-center space-x-3">
              <span className="text-4xl sm:text-5xl font-black text-[#2D3748] font-mono tracking-widest selection:bg-[#7A9070]/30">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-white border border-[#D9DEC9] text-[#4A5568] hover:text-[#7A9070] hover:border-[#7A9070] shadow-xs transition-colors"
                title="방 코드 복사"
              >
                {copiedCode ? <Check className="w-5 h-5 text-[#38A169]" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-[#EAEAE2] inline-block">
              <QRCodeSVG 
                value={joinUrl} 
                size={220} 
                level="M" 
                fgColor="#2D3748" 
                bgColor="#FFFFFF"
              />
            </div>
            <div className="flex items-center space-x-2 text-xs text-[#718096]">
              <Smartphone className="w-4 h-4 text-[#7A9070]" />
              <span>QR 스캔 시 바로 학생 입장 화면으로 연결됩니다</span>
            </div>
          </div>

          {/* 3 Step Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
            <div className="bg-[#F9F9F6] p-3 rounded-xl border border-[#EAEAE2]">
              <span className="w-5 h-5 rounded-full bg-[#7A9070] text-white font-bold text-xs flex items-center justify-center mb-1.5">1</span>
              <p className="text-xs font-bold text-[#2D3748]">방 코드 입력</p>
              <p className="text-[11px] text-[#718096]">위 방 코드 혹은 QR 접속</p>
            </div>
            <div className="bg-[#F9F9F6] p-3 rounded-xl border border-[#EAEAE2]">
              <span className="w-5 h-5 rounded-full bg-[#7A9070] text-white font-bold text-xs flex items-center justify-center mb-1.5">2</span>
              <p className="text-xs font-bold text-[#2D3748]">학번/이름 입력</p>
              <p className="text-[11px] text-[#718096]">비밀번호 4자리 설정</p>
            </div>
            <div className="bg-[#F9F9F6] p-3 rounded-xl border border-[#EAEAE2]">
              <span className="w-5 h-5 rounded-full bg-[#7A9070] text-white font-bold text-xs flex items-center justify-center mb-1.5">3</span>
              <p className="text-xs font-bold text-[#2D3748]">4단계 작성</p>
              <p className="text-[11px] text-[#718096]">탐구-설계-산출-평가</p>
            </div>
          </div>

          {/* Link Copy */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <div className="w-full sm:w-auto px-4 py-2 bg-[#F9F9F6] border border-[#EAEAE2] rounded-xl text-xs font-mono text-[#4A5568] truncate max-w-sm">
              {joinUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-4 py-2 bg-[#7A9070] hover:bg-[#687D5F] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center space-x-1.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '링크 복사 완료!' : '학생 입장 링크 복사'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F9F9F6] px-6 py-3 border-t border-[#EAEAE2] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-[#D9DEC9] text-[#4A5568] hover:bg-[#F4F5EE] rounded-xl text-xs font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
