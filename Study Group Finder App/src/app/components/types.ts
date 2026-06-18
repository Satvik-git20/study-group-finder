export type Level = "Beginner" | "Intermediate" | "Advanced";
export type Mode = "Online" | "Offline";
export type TimeSlot = "Morning" | "Afternoon" | "Evening" | "Late Night" | "Weekend";

export type User = {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  availability: string;
  avatar?: string;
};

export type Attachment = {
  name: string;
  dataUrl: string;
  size: number;
  type: string;
};

export type Message = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isAnnouncement?: boolean;
  attachments?: Attachment[];
  reactions?: Record<string, string[]>;
  readBy?: string[];
};

export type Session = {
  id: string;
  title: string;
  startsAt: number;
  durationMin: number;
  createdBy: string;
};

export type Quiz = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  createdBy: string;
  createdAt: number;
};

export type QuizAttempt = {
  quizId: string;
  userId: string;
  selectedIndex: number;
  correct: boolean;
  timestamp: number;
};

export type JoinRequest = {
  userId: string;
  userName: string;
  timestamp: number;
};

export type Group = {
  id: string;
  subject: string;
  level: Level;
  description: string;
  timing: string;
  timeSlot?: TimeSlot;
  mode: Mode;
  ownerId: string;
  ownerName: string;
  members: { id: string; name: string; role?: "admin" | "member" }[];
  messages: Message[];
  sessions?: Session[];
  quizzes?: Quiz[];
  quizAttempts?: QuizAttempt[];
  joinRequests?: JoinRequest[];
  requireApproval?: boolean;
  createdAt: number;
};

export type Notification = {
  id: string;
  userId: string;
  type: "message" | "join_request" | "approved" | "session" | "badge" | "announcement" | "removed";
  text: string;
  groupId?: string;
  timestamp: number;
  read?: boolean;
};

export type UserStats = {
  points: number;
  badges: string[];
  studyMinutes: number;
  searchHistory: string[];
};
