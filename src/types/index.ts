export type UserRole = 'CLIENT' | 'GUIDE' | 'ADMIN';

export type RequestStatus = 'OPEN' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'EXPIRED';

export type BookingStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type NegotiationStatus = 'PENDING_OFFER' | 'AGREED' | 'REJECTED' | 'CLOSED';

export type LanguageProficiency = 'NATIVE' | 'FLUENT' | 'CONVERSATIONAL';

export interface GuideLanguage {
  language: string;
  proficiency: LanguageProficiency;
}

export interface WorkingHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  isActive: boolean;
}

export interface BlackoutDate {
  date: string; // "YYYY-MM-DD"
  reason: string;
}

export interface GuidePortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  duration: string;
  highlights: string[];
}

export interface GuideProfile {
  id: string; // Database internal UUID / ID
  guideId: string; // Auto-generated unique identifier e.g. "GC-G-100001"
  username: string; // Guide chosen unique username e.g. "mumbai_explorer"
  fullName: string;
  email: string;
  phone: string;
  profilePhoto: string;
  bio: string;
  languages: GuideLanguage[];
  serviceAreas: string[]; // e.g. ["Mumbai", "South Mumbai", "Elephanta Caves"]
  country: string;
  specializations: string[]; // e.g. ["Heritage & Architecture", "Street Food", "Art History"]
  yearsOfExperience: number;
  qualifications: string[];
  baseHourlyRate: number; // in local currency
  currency: string;       // e.g. "INR", "JPY", "EUR"
  isVerified: boolean;
  verificationDocument?: string;
  rating: number;         // 1.0 - 5.0
  reviewCount: number;
  workingHours: WorkingHours[];
  blackoutDates: BlackoutDate[];
  maxBookingsPerDay: number;
  portfolio?: GuidePortfolioItem[];
  isActive: boolean;
  createdAt: string;
}

export interface ClientProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  preferredLanguage: string;
  profilePhoto: string;
  createdAt: string;
}

export interface ClientRequest {
  id: string;             // Request ID e.g. "REQ-2026-9041"
  clientId: string;
  clientName: string;
  clientNationality: string;
  destinationCountry: string;
  destinationCity: string;
  preferredLanguage: string;
  additionalLanguages?: string[];
  travelDate: string;     // "YYYY-MM-DD"
  startTime: string;      // "10:00"
  endTime: string;        // "14:00"
  durationHours: number;
  numberOfTourists: number;
  tourType: string;       // "Historical", "Cultural", "Food Tour", "Sightseeing", "Custom"
  preferredSpecialization?: string;
  approximateBudget: number;
  currency: string;
  meetingLocation: string;
  specialInstructions?: string;
  status: RequestStatus;
  assignedGuideId?: string; // Guide's guideId or profile id
  assignedGuideUsername?: string;
  bookingId?: string;
  version: number;        // Concurrency control version
  createdAt: string;
  acceptedAt?: string;
}

export interface RequestInvitation {
  id: string;
  requestId: string;
  guideId: string;        // internal ID
  guideCode: string;      // "GC-G-100001"
  status: InvitationStatus;
  invitedAt: string;
  respondedAt?: string;
  declineReason?: string;
}

export interface NegotiationOffer {
  id: string;
  bookingId: string;
  requestId: string;
  senderRole: 'CLIENT' | 'GUIDE';
  senderId: string;
  senderName: string;
  proposedAmount: number;
  currency: string;
  note?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';
  createdAt: string;
}

export interface Booking {
  id: string;             // Booking ID e.g. "BK-2026-0042"
  requestId: string;
  clientId: string;
  clientName: string;
  guideId: string;
  guideCode: string;      // "GC-G-100001"
  guideUsername: string;
  destinationCity: string;
  travelDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  numberOfTourists: number;
  tourType: string;
  meetingLocation: string;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  agreedPrice: number | null;
  currency: string;
  bookingStatus: BookingStatus;
  negotiationStatus: NegotiationStatus;
  createdAt: string;
  completedAt?: string;
  reviewSubmitted?: boolean;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: 'CLIENT' | 'GUIDE';
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  clientName: string;
  clientNationality: string;
  guideId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface PricingRule {
  city: string;
  country: string;
  currency: string;
  baseHourlyRate: number;
  touristMultiplier: number; // e.g. 1.1 per extra tourist above 2
  tourTypeMultiplier: Record<string, number>;
}

export interface ConcurrencyAuditLog {
  id: string;
  requestId: string;
  timestamp: string;
  attemptedByGuideCode: string;
  attemptedByUsername: string;
  result: 'SUCCESS' | 'RACE_LOST_ALREADY_ACCEPTED' | 'AVAILABILITY_CONFLICT';
  latencyMs: number;
  message: string;
}

export type NotificationChannel = 'IN_APP' | 'GMAIL' | 'WHATSAPP';

export interface AppNotification {
  id: string;
  recipientId: string; // guideId or clientId
  recipientRole: 'CLIENT' | 'GUIDE';
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  type: 'REQUEST_CREATED' | 'REQUEST_ACCEPTED' | 'OFFER_MADE' | 'OFFER_ACCEPTED' | 'MESSAGE_RECEIVED';
  referenceId: string; // requestId or bookingId
  timestamp: string;
  isRead: boolean;
  externalLink?: string; // Direct WhatsApp deep link or Gmail compose URL
  details?: {
    tourDate?: string;
    destinationCity?: string;
    guideName?: string;
    guidePhone?: string;
    guideCode?: string;
    guideUsername?: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    meetingLocation?: string;
    agreedPrice?: number;
    currency?: string;
  };
}
