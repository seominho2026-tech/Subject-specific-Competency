import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { ClassRoom, StudentRecord, PortfolioStages, AttachedFile, AiDraft } from './types';

// Load config from generated firebase-applet-config.json
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Helper for virtual student email generation
export function createVirtualStudentEmail(roomCode: string, studentNumber: string): string {
  // Sanitize roomCode and studentNumber for email local part
  const cleanRoom = roomCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanNumber = studentNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `std_${cleanRoom}_${cleanNumber}@school-portfolio.internal`;
}

// Student Auto Login or Sign Up
export async function authenticateStudent(roomCode: string, studentNumber: string, studentName: string, password: string) {
  const email = createVirtualStudentEmail(roomCode, studentNumber);
  
  // Try signing in first
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCred.user, isNew: false };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
      // Create user if not found
      try {
        const newUserCred = await createUserWithEmailAndPassword(auth, email, password);
        return { user: newUserCred.user, isNew: true };
      } catch (createError: any) {
        // If password was wrong for existing account
        if (createError.code === 'auth/email-already-in-use') {
          throw new Error('비밀번호가 일치하지 않습니다. 이전에 설정한 비밀번호를 입력해주세요.');
        }
        throw createError;
      }
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('비밀번호가 일치하지 않습니다. 이전에 설정한 비밀번호를 입력해주세요.');
    }
    throw error;
  }
}

// Check if a Room exists
export async function checkRoomExists(roomCode: string): Promise<ClassRoom | null> {
  const cleanCode = roomCode.trim().toLowerCase();
  const roomDocRef = doc(db, 'rooms', cleanCode);
  const roomSnap = await getDoc(roomDocRef);
  if (roomSnap.exists()) {
    return { id: roomSnap.id, ...roomSnap.data() } as ClassRoom;
  }
  return null;
}

// Create a new Room (with duplicate check)
export async function createClassRoom(roomData: {
  roomCode: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  achievementStandards: string;
  teacherName?: string;
}): Promise<ClassRoom> {
  const cleanCode = roomData.roomCode.trim().toLowerCase();
  
  // Validate room code
  if (!cleanCode || !/^[a-zA-Z0-9_-]{2,20}$/.test(cleanCode)) {
    throw new Error('방 코드는 2~20자의 영문, 숫자, 하이픈(-), 밑줄(_)만 가능합니다.');
  }

  const existing = await checkRoomExists(cleanCode);
  if (existing) {
    throw new Error(`방 코드 "${cleanCode}"는 이미 사용 중입니다. 다른 코드를 입력해주세요.`);
  }

  const newRoom: ClassRoom = {
    id: cleanCode,
    title: roomData.title.trim(),
    subject: roomData.subject.trim(),
    grade: roomData.grade.trim(),
    description: roomData.description.trim(),
    achievementStandards: roomData.achievementStandards.trim(),
    teacherName: roomData.teacherName?.trim() || '선생님',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'rooms', cleanCode), newRoom);
  return newRoom;
}

// Calculate stage completion (0 to 4)
export function calculateCompletedStages(stages: PortfolioStages): number {
  let count = 0;
  // Stage 1: Exploration
  if (stages.exploration && (stages.exploration.topic?.trim() || stages.exploration.motivation?.trim())) {
    count++;
  }
  // Stage 2: Design
  if (stages.design && (stages.design.plan?.trim() || stages.design.toolsAndTech?.trim() || stages.design.processDesign?.trim())) {
    count++;
  }
  // Stage 3: Outcome
  if (stages.outcome && (stages.outcome.finalResult?.trim() || stages.outcome.problemSolving?.trim() || stages.outcome.insights?.trim())) {
    count++;
  }
  // Stage 4: Self Evaluation
  if (stages.selfEvaluation && (stages.selfEvaluation.competencyGrowth?.trim() || stages.selfEvaluation.reflection?.trim() || stages.selfEvaluation.futurePlans?.trim())) {
    count++;
  }
  return count;
}

// Initial empty stages generator
export function getInitialStages(): PortfolioStages {
  return {
    exploration: {
      topic: '',
      motivation: '',
      question: '',
      backgroundResearch: '',
    },
    design: {
      plan: '',
      roles: '',
      toolsAndTech: '',
      processDesign: '',
    },
    outcome: {
      finalResult: '',
      problemSolving: '',
      insights: '',
    },
    selfEvaluation: {
      competencyGrowth: '',
      reflection: '',
      futurePlans: '',
    },
  };
}

// Get or Create Student Record in Room
export async function getOrCreateStudentRecord(
  roomCode: string, 
  studentNumber: string, 
  studentName: string,
  authUid?: string,
  authEmail?: string
): Promise<StudentRecord> {
  const cleanCode = roomCode.trim().toLowerCase();
  const cleanNumber = studentNumber.trim();
  const studentDocId = `${cleanNumber}_${studentName.trim()}`;
  const studentDocRef = doc(db, 'rooms', cleanCode, 'students', studentDocId);

  const snap = await getDoc(studentDocRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as StudentRecord;
  }

  const initialRecord: StudentRecord = {
    id: studentDocId,
    roomCode: cleanCode,
    studentNumber: cleanNumber,
    studentName: studentName.trim(),
    authUid,
    authEmail,
    stages: getInitialStages(),
    attachments: [],
    completedStageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(studentDocRef, initialRecord);
  return initialRecord;
}

// Save Student Portfolio
export async function saveStudentRecord(
  roomCode: string,
  studentDocId: string,
  stages: PortfolioStages,
  attachments: AttachedFile[]
): Promise<void> {
  const cleanCode = roomCode.trim().toLowerCase();
  const studentDocRef = doc(db, 'rooms', cleanCode, 'students', studentDocId);
  const completedStageCount = calculateCompletedStages(stages);

  await updateDoc(studentDocRef, {
    stages,
    attachments,
    completedStageCount,
    updatedAt: new Date().toISOString(),
  });
}

// Save Teacher's AI Draft / Notes for Student
export async function saveStudentAiDraft(
  roomCode: string,
  studentDocId: string,
  aiDraft: AiDraft
): Promise<void> {
  const cleanCode = roomCode.trim().toLowerCase();
  const studentDocRef = doc(db, 'rooms', cleanCode, 'students', studentDocId);

  await updateDoc(studentDocRef, {
    aiDraft,
    updatedAt: new Date().toISOString(),
  });
}

// Subscribe to Rooms List
export function subscribeRooms(callback: (rooms: ClassRoom[]) => void) {
  const roomsColl = collection(db, 'rooms');
  return onSnapshot(roomsColl, (snapshot) => {
    const rooms = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as ClassRoom[];
    
    // Sort by createdAt descending
    rooms.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(rooms);
  }, (error) => {
    console.error('Error fetching rooms:', error);
  });
}

// Subscribe to Room Students List
export function subscribeRoomStudents(roomCode: string, callback: (students: StudentRecord[]) => void) {
  const cleanCode = roomCode.trim().toLowerCase();
  const studentsColl = collection(db, 'rooms', cleanCode, 'students');
  return onSnapshot(studentsColl, (snapshot) => {
    const students = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as StudentRecord[];

    // Sort by student number ascending
    students.sort((a, b) => a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true }));
    callback(students);
  }, (error) => {
    console.error(`Error fetching students for room ${roomCode}:`, error);
  });
}
