import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { RoomDetailView } from './components/RoomDetailView';
import { StudentEntry } from './components/StudentEntry';
import { StudentPortfolio } from './components/StudentPortfolio';
import type { ClassRoom, StudentRecord } from './types';

type AppView = 
  | 'home'
  | 'teacher_dashboard'
  | 'teacher_room_detail'
  | 'student_entry'
  | 'student_portfolio';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  
  // Teacher selection
  const [selectedRoom, setSelectedRoom] = useState<ClassRoom | null>(null);

  // Student active session
  const [activeStudentRoom, setActiveStudentRoom] = useState<ClassRoom | null>(null);
  const [activeStudent, setActiveStudent] = useState<StudentRecord | null>(null);
  const [initialStudentRoomCode, setInitialStudentRoomCode] = useState<string>('');

  // Check URL query parameters (e.g. ?room=tech2) on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room') || urlParams.get('code');
      if (roomParam) {
        setInitialStudentRoomCode(roomParam.trim().toLowerCase());
        setCurrentView('student_entry');
      }
    } catch (e) {
      console.error('URL params parsing error:', e);
    }
  }, []);

  // Handlers for Navigation
  const handleNavigateHome = () => {
    setCurrentView('home');
  };

  const handleSelectTeacherPortal = () => {
    setCurrentView('teacher_dashboard');
  };

  const handleSelectStudentPortal = (roomCode?: string) => {
    if (roomCode) {
      setInitialStudentRoomCode(roomCode);
    }
    setCurrentView('student_entry');
  };

  const handleSelectRoomForTeacher = (room: ClassRoom) => {
    setSelectedRoom(room);
    setCurrentView('teacher_room_detail');
  };

  const handleBackToTeacherDashboard = () => {
    setSelectedRoom(null);
    setCurrentView('teacher_dashboard');
  };

  const handleStudentEntered = (room: ClassRoom, student: StudentRecord) => {
    setActiveStudentRoom(room);
    setActiveStudent(student);
    setCurrentView('student_portfolio');
  };

  const handleStudentExit = () => {
    setActiveStudent(null);
    setActiveStudentRoom(null);
    setCurrentView('student_entry');
  };

  // Determine current role for Navbar
  const getNavRole = (): 'home' | 'teacher' | 'student' => {
    if (currentView === 'teacher_dashboard' || currentView === 'teacher_room_detail') {
      return 'teacher';
    }
    if (currentView === 'student_portfolio' || currentView === 'student_entry') {
      return 'student';
    }
    return 'home';
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#2D3748] flex flex-col selection:bg-[#7A9070]/20 selection:text-[#3B4D35]">
      {/* Top Navigation */}
      <Navbar
        currentRole={getNavRole()}
        roomCode={
          currentView === 'teacher_room_detail'
            ? selectedRoom?.id
            : currentView === 'student_portfolio'
            ? activeStudentRoom?.id
            : undefined
        }
        roomTitle={
          currentView === 'teacher_room_detail'
            ? selectedRoom?.title
            : currentView === 'student_portfolio'
            ? activeStudentRoom?.title
            : undefined
        }
        studentName={currentView === 'student_portfolio' ? activeStudent?.studentName : undefined}
        studentNumber={currentView === 'student_portfolio' ? activeStudent?.studentNumber : undefined}
        onNavigateHome={handleNavigateHome}
        onSwitchToStudent={() => handleSelectStudentPortal()}
        onSwitchToTeacher={handleSelectTeacherPortal}
        onStudentExit={currentView === 'student_portfolio' ? handleStudentExit : undefined}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onSelectTeacher={handleSelectTeacherPortal}
            onSelectStudent={(code) => handleSelectStudentPortal(code)}
          />
        )}

        {currentView === 'teacher_dashboard' && (
          <TeacherDashboard
            onSelectRoom={handleSelectRoomForTeacher}
          />
        )}

        {currentView === 'teacher_room_detail' && selectedRoom && (
          <RoomDetailView
            room={selectedRoom}
            onBack={handleBackToTeacherDashboard}
          />
        )}

        {currentView === 'student_entry' && (
          <StudentEntry
            initialRoomCode={initialStudentRoomCode}
            onBack={handleNavigateHome}
            onStudentEntered={handleStudentEntered}
          />
        )}

        {currentView === 'student_portfolio' && activeStudentRoom && activeStudent && (
          <StudentPortfolio
            room={activeStudentRoom}
            student={activeStudent}
            onExit={handleStudentExit}
          />
        )}
      </main>
    </div>
  );
}
