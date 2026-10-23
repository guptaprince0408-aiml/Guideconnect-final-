import { GuideProfile, ClientRequest, Booking } from '../types';

export interface MatchEvaluation {
  guide: GuideProfile;
  isEligible: boolean;
  relevanceScore: number; // 0 - 100
  reasons: string[];
  disqualificationReason?: string;
}

export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  // Convert "HH:mm" to minutes from midnight
  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);

  // Overlap occurs when interval A starts before B ends AND interval B starts before A ends
  return aStart < bEnd && bStart < aEnd;
}

export function evaluateGuideEligibility(
  guide: GuideProfile,
  request: ClientRequest,
  existingBookings: Booking[]
): MatchEvaluation {
  const reasons: string[] = [];

  // 1. Mandatory: Active Status
  if (!guide.isActive) {
    return {
      guide,
      isEligible: false,
      relevanceScore: 0,
      reasons: [],
      disqualificationReason: 'Guide account is currently inactive.'
    };
  }

  // 2. Mandatory: Destination Support
  const normalizedCity = request.destinationCity.trim().toLowerCase();
  const supportsDestination = guide.serviceAreas.some(area =>
    area.toLowerCase().includes(normalizedCity) || normalizedCity.includes(area.toLowerCase())
  );
  if (!supportsDestination) {
    return {
      guide,
      isEligible: false,
      relevanceScore: 0,
      reasons: [],
      disqualificationReason: `Guide does not service destination: ${request.destinationCity}.`
    };
  }
  reasons.push(`Services destination area: ${request.destinationCity}`);

  // 3. Mandatory: Language Match
  const reqLang = request.preferredLanguage.trim().toLowerCase();
  const matchedLang = guide.languages.find(l => l.language.toLowerCase() === reqLang);
  if (!matchedLang) {
    return {
      guide,
      isEligible: false,
      relevanceScore: 0,
      reasons: [],
      disqualificationReason: `Does not speak required language: ${request.preferredLanguage}.`
    };
  }
  reasons.push(`Speaks ${matchedLang.language} (${matchedLang.proficiency})`);

  // 4. Mandatory: Blackout Dates
  const isBlackedOut = guide.blackoutDates.some(b => b.date === request.travelDate);
  if (isBlackedOut) {
    return {
      guide,
      isEligible: false,
      relevanceScore: 0,
      reasons: [],
      disqualificationReason: `Guide has marked unavailable on ${request.travelDate}.`
    };
  }

  // 5. Mandatory: Working Hours check
  const requestDateObj = new Date(request.travelDate);
  // Get day of week (0 = Sunday ... 6 = Saturday)
  const dayOfWeek = requestDateObj.getDay();
  const scheduleForDay = guide.workingHours.find(w => w.dayOfWeek === dayOfWeek);

  if (scheduleForDay && scheduleForDay.isActive) {
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    const reqStart = toMinutes(request.startTime);
    const reqEnd = toMinutes(request.endTime);
    const workStart = toMinutes(scheduleForDay.startTime);
    const workEnd = toMinutes(scheduleForDay.endTime);

    if (reqStart < workStart || reqEnd > workEnd) {
      return {
        guide,
        isEligible: false,
        relevanceScore: 0,
        reasons: [],
        disqualificationReason: `Request time (${request.startTime}-${request.endTime}) is outside guide's working hours (${scheduleForDay.startTime}-${scheduleForDay.endTime}) on this day.`
      };
    }
    reasons.push(`Available during working hours (${scheduleForDay.startTime} - ${scheduleForDay.endTime})`);
  }

  // 6. Mandatory: Conflicting Accepted Bookings
  const guideBookingsOnDate = existingBookings.filter(
    b => b.guideId === guide.id &&
         b.travelDate === request.travelDate &&
         b.bookingStatus !== 'CANCELLED'
  );

  // Check max bookings per day
  if (guideBookingsOnDate.length >= guide.maxBookingsPerDay) {
    return {
      guide,
      isEligible: false,
      relevanceScore: 0,
      reasons: [],
      disqualificationReason: `Guide reached daily capacity limit of ${guide.maxBookingsPerDay} bookings for ${request.travelDate}.`
    };
  }

  // Check overlapping time interval
  for (const b of guideBookingsOnDate) {
    if (isTimeOverlapping(request.startTime, request.endTime, b.startTime, b.endTime)) {
      return {
        guide,
        isEligible: false,
        relevanceScore: 0,
        reasons: [],
        disqualificationReason: `Has overlapping accepted booking (${b.id}) on ${request.travelDate} from ${b.startTime} to ${b.endTime}.`
      };
    }
  }
  reasons.push('No schedule conflicts with existing bookings');

  // Calculate Relevance Score (40 - 100)
  let score = 50; // base score for qualifying

  // Verified boost
  if (guide.isVerified) {
    score += 15;
    reasons.push('Official verified guide license');
  }

  // Language proficiency bonus
  if (matchedLang.proficiency === 'NATIVE') {
    score += 15;
  } else if (matchedLang.proficiency === 'FLUENT') {
    score += 10;
  }

  // Tour specialization bonus
  if (request.preferredSpecialization || request.tourType) {
    const desired = (request.preferredSpecialization || request.tourType).toLowerCase();
    const hasSpecialization = guide.specializations.some(s => s.toLowerCase().includes(desired) || desired.includes(s.toLowerCase()));
    if (hasSpecialization) {
      score += 10;
      reasons.push(`Specializes in ${request.tourType || request.preferredSpecialization}`);
    }
  }

  // Rating & experience bonus
  if (guide.rating >= 4.8) {
    score += 10;
  } else if (guide.rating >= 4.5) {
    score += 5;
  }

  if (guide.yearsOfExperience >= 5) {
    score += Math.min(guide.yearsOfExperience, 10);
  }

  const finalScore = Math.min(Math.round(score), 100);

  return {
    guide,
    isEligible: true,
    relevanceScore: finalScore,
    reasons
  };
}

export function findEligibleGuides(
  guides: GuideProfile[],
  request: ClientRequest,
  existingBookings: Booking[]
): MatchEvaluation[] {
  const evaluations = guides.map(g => evaluateGuideEligibility(g, request, existingBookings));
  // Sort eligible ones by relevanceScore descending
  return evaluations.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.relevanceScore - a.relevanceScore;
  });
}
