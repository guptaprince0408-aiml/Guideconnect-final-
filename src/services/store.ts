import {
  GuideProfile,
  ClientProfile,
  ClientRequest,
  RequestInvitation,
  Booking,
  NegotiationOffer,
  Message,
  Review,
  PricingRule,
  ConcurrencyAuditLog,
  AppNotification,
  GuidePortfolioItem
} from '../types';
import { calculateEstimatedPrice, DEFAULT_PRICING_RULES } from './pricingEngine';
import { findEligibleGuides, isTimeOverlapping } from './matchingEngine';
import { sendRealWorldEmailViaFreeApi } from './realNotificationService';

const STORAGE_KEY = 'guideconnect_db_state_v4';

// In-memory Mutex for atomic operations
class ConcurrencyMutex {
  private queue: (() => void)[] = [];
  private locked: boolean = false;

  async acquire(): Promise<() => void> {
    return new Promise(resolve => {
      const run = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) next();
        });
      };

      if (!this.locked) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

const dbMutex = new ConcurrencyMutex();

export interface DatabaseState {
  guides: GuideProfile[];
  clients: ClientProfile[];
  requests: ClientRequest[];
  invitations: RequestInvitation[];
  bookings: Booking[];
  offers: NegotiationOffer[];
  messages: Message[];
  reviews: Review[];
  pricingRules: PricingRule[];
  auditLogs: ConcurrencyAuditLog[];
  notifications: AppNotification[];
  nextGuideSequence: number;
}

export const INITIAL_GUIDES: GuideProfile[] = [
  {
    id: 'guide-001',
    guideId: 'GC-G-100001',
    username: 'mumbai_explorer',
    fullName: 'Aarav Mehta',
    email: 'aarav.mehta@guideconnect.travel',
    phone: '+91 98201 44521',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Government-certified heritage docent and 8-year veteran of South Bombay architectural walks. Passionate about Gothic revival monuments, dockside legends, and artisanal spice bazaars.',
    languages: [
      { language: 'English', proficiency: 'NATIVE' },
      { language: 'Hindi', proficiency: 'NATIVE' },
      { language: 'Marathi', proficiency: 'FLUENT' },
      { language: 'French', proficiency: 'FLUENT' }
    ],
    serviceAreas: ['Mumbai', 'South Mumbai', 'Fort Heritage', 'Elephanta Island', 'Colaba'],
    country: 'India',
    specializations: ['Heritage & Architecture', 'Food Tour', 'Cultural'],
    yearsOfExperience: 8,
    qualifications: ['Ministry of Tourism Lic. #IN-MH-8821', 'Archaeological Survey of India Docent'],
    baseHourlyRate: 750,
    currency: 'INR',
    isVerified: true,
    verificationDocument: 'MH-TOUR-LIC-8821.pdf',
    rating: 4.95,
    reviewCount: 42,
    workingHours: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 5, startTime: '08:00', endTime: '20:00', isActive: true },
      { dayOfWeek: 6, startTime: '08:00', endTime: '20:00', isActive: true }
    ],
    blackoutDates: [{ date: '2026-10-25', reason: 'Annual docent workshop' }],
    maxBookingsPerDay: 2,
    portfolio: [
      {
        id: 'port-001',
        title: 'Victorian Gothic & Art Deco Heritage Walk',
        description: 'An architectural pilgrimage through Mumbai’s UNESCO-inscribed Victorian Gothic monuments and the world’s second-largest cluster of Art Deco edifices.',
        imageUrl: '/src/assets/images/destination_mumbai_heritage_1791808690908.jpg',
        location: 'Fort & Colaba, South Mumbai',
        duration: '4 Hours',
        highlights: ['Victoria Terminus Heritage', 'Rajabai Clock Tower', 'Marine Drive Promenade', 'Colonial Navy Docks']
      },
      {
        id: 'port-002',
        title: 'Secret Spice Markets & Street Gastronomy',
        description: 'Sensory journey through the 150-year-old Crawford Market vaults, wholesale spice merchants, and curated artisanal street food stalls.',
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
        location: 'Crawford Market & Bhuleshwar',
        duration: '3.5 Hours',
        highlights: ['Cardamom & saffron vault tasting', 'Fresh jalebi masters', 'Historic colonial market ironwork']
      },
      {
        id: 'port-003',
        title: 'Elephanta Rock-Cut Caves Docent Excursion',
        description: 'Private boat excursion across Mumbai Harbour to the ancient 6th-century rock-cut Shiva caves and UNESCO World Heritage sanctuary.',
        imageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f4438186?auto=format&fit=crop&w=600&q=80',
        location: 'Elephanta Island, Mumbai',
        duration: '5 Hours',
        highlights: ['Trimurti Sadashiva masterpiece', 'Harbor scenic cruise', 'Archaeological site docent walk']
      }
    ],
    isActive: true,
    createdAt: '2025-01-15T08:00:00Z'
  },
  {
    id: 'guide-002',
    guideId: 'GC-G-100002',
    username: 'heritage_sahil',
    fullName: 'Sahil Deshmukh',
    email: 'sahil.d@guideconnect.travel',
    phone: '+91 98199 12384',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Historian, docent and storyteller specializing in Mumbai colonial transformation and street gastronomy. Native speaker of Marathi & Hindi.',
    languages: [
      { language: 'Marathi', proficiency: 'NATIVE' },
      { language: 'Hindi', proficiency: 'NATIVE' },
      { language: 'English', proficiency: 'FLUENT' },
      { language: 'German', proficiency: 'FLUENT' }
    ],
    serviceAreas: ['Mumbai', 'Bandra', 'Marine Drive', 'Kala Ghoda'],
    country: 'India',
    specializations: ['Food Tour', 'Historical', 'Sightseeing'],
    yearsOfExperience: 6,
    qualifications: ['Maharashtra Tourism License #MTDC-4109'],
    baseHourlyRate: 700,
    currency: 'INR',
    isVerified: true,
    verificationDocument: 'MTDC-LIC-4109.pdf',
    rating: 4.88,
    reviewCount: 29,
    workingHours: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 6, startTime: '09:00', endTime: '19:00', isActive: true }
    ],
    blackoutDates: [],
    maxBookingsPerDay: 2,
    portfolio: [
      {
        id: 'port-010',
        title: 'Bandra Portuguese Hamlets & Coastal Gastronomy',
        description: 'Discover 400-year-old Catholic villages of Ranwar, vibrant street mural art, and heritage family bakeries.',
        imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
        location: 'Bandra West, Mumbai',
        duration: '3.5 Hours',
        highlights: ['Ranwar Village Heritage', 'Mount Mary Basilica', 'Coastal street seafood stalls']
      },
      {
        id: 'port-011',
        title: 'Kala Ghoda Art District & Sunset Promenade',
        description: 'Tour of contemporary galleries, boutique bookshops, and sunset vistas along Marine Drive.',
        imageUrl: '/src/assets/images/destination_mumbai_heritage_1791808690908.jpg',
        location: 'Kala Ghoda, Mumbai',
        duration: '3 Hours',
        highlights: ['Kala Ghoda galleries', 'Heritage synagogues', 'Queens Necklace sunset']
      }
    ],
    isActive: true,
    createdAt: '2025-02-01T10:00:00Z'
  },
  {
    id: 'guide-003',
    guideId: 'GC-G-100003',
    username: 'kyoto_zen_walker',
    fullName: 'Kenji Tanaka',
    email: 'kenji.tanaka@guideconnect.travel',
    phone: '+81 75 491 8820',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Kyoto-born licensed National Guide-Interpreter. Decades of deep access to centuries-old Zen temple gardens, Gion tea houses, and Arashiyama bamboo sanctuaries.',
    languages: [
      { language: 'Japanese', proficiency: 'NATIVE' },
      { language: 'English', proficiency: 'NATIVE' },
      { language: 'Spanish', proficiency: 'CONVERSATIONAL' }
    ],
    serviceAreas: ['Kyoto', 'Gion', 'Arashiyama', 'Higashiyama'],
    country: 'Japan',
    specializations: ['Cultural', 'Historical', 'Custom'],
    yearsOfExperience: 11,
    qualifications: ['Japan National Government Licensed Guide-Interpreter #EN-04421'],
    baseHourlyRate: 4000,
    currency: 'JPY',
    isVerified: true,
    verificationDocument: 'JNTO-CERT-04421.pdf',
    rating: 4.98,
    reviewCount: 64,
    workingHours: [
      { dayOfWeek: 0, startTime: '08:30', endTime: '17:30', isActive: true },
      { dayOfWeek: 1, startTime: '08:30', endTime: '17:30', isActive: true },
      { dayOfWeek: 2, startTime: '08:30', endTime: '17:30', isActive: true },
      { dayOfWeek: 3, startTime: '08:30', endTime: '17:30', isActive: true },
      { dayOfWeek: 4, startTime: '08:30', endTime: '17:30', isActive: true },
      { dayOfWeek: 5, startTime: '08:30', endTime: '18:00', isActive: true },
      { dayOfWeek: 6, startTime: '08:30', endTime: '18:00', isActive: true }
    ],
    blackoutDates: [],
    maxBookingsPerDay: 2,
    portfolio: [
      {
        id: 'port-020',
        title: 'Gion Preservation Quarter & Kennin-ji Zen Temple',
        description: 'Immersive exploration of traditional preservation streets, Geiko culture protocols, and Japan’s oldest Zen sanctuary.',
        imageUrl: '/src/assets/images/destination_kyoto_temple_1791808708728.jpg',
        location: 'Gion & Higashiyama, Kyoto',
        duration: '4 Hours',
        highlights: ['Kennin-ji twin dragon ceiling', 'Historic machiya townhouses', 'Tea ceremony protocol']
      },
      {
        id: 'port-021',
        title: 'Arashiyama Morning Mist & Bamboo Forest',
        description: 'Early morning serenity through towering bamboo groves, Tenryu-ji Sogenchi landscape garden, and mountain shrines.',
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
        location: 'Arashiyama, Kyoto',
        duration: '4.5 Hours',
        highlights: ['Sagano Bamboo Path', 'Tenryu-ji Sogenchi garden', 'Togetsukyo Bridge views']
      }
    ],
    isActive: true,
    createdAt: '2024-11-10T12:00:00Z'
  },
  {
    id: 'guide-004',
    guideId: 'GC-G-100004',
    username: 'colosseum_insider',
    fullName: 'Matteo Rossi',
    email: 'matteo.rossi@guideconnect.travel',
    phone: '+39 06 482 9912',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    bio: 'Classical archeologist and certified Rome docent. Expert in Imperial Forums, subterranean catacombs, and authentic Trastevere cuisine.',
    languages: [
      { language: 'Italian', proficiency: 'NATIVE' },
      { language: 'English', proficiency: 'NATIVE' },
      { language: 'French', proficiency: 'FLUENT' }
    ],
    serviceAreas: ['Rome', 'Colosseum', 'Vatican City', 'Trastevere', 'Centro Storico'],
    country: 'Italy',
    specializations: ['Historical', 'Cultural', 'Food Tour'],
    yearsOfExperience: 9,
    qualifications: ['Regione Lazio Guida Turistica Abilitata #RM-2016-554'],
    baseHourlyRate: 35,
    currency: 'EUR',
    isVerified: true,
    verificationDocument: 'LAZIO-GUIDA-554.pdf',
    rating: 4.92,
    reviewCount: 51,
    workingHours: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 6, startTime: '09:00', endTime: '19:00', isActive: true }
    ],
    blackoutDates: [],
    maxBookingsPerDay: 2,
    portfolio: [
      {
        id: 'port-030',
        title: 'Colosseum Underground & Imperial Roman Forum',
        description: 'Archaeologist-guided access into the subterranean gladiator hypogeum and the Senate ruins of Ancient Rome.',
        imageUrl: '/src/assets/images/destination_rome_colosseum_1791808720486.jpg',
        location: 'Centro Storico, Rome',
        duration: '4 Hours',
        highlights: ['Underground arena floor', 'Julius Caesar funeral altar', 'Palatine Hill imperial villas']
      },
      {
        id: 'port-031',
        title: 'Trastevere Medieval Alleys & Authentic Culinary Walk',
        description: 'Cobblestone journey across Tiber Island to artisan trattorias, medieval basilicas, and historic bakeries.',
        imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
        location: 'Trastevere, Rome',
        duration: '3.5 Hours',
        highlights: ['Santa Maria in Trastevere', 'Artisan cacio e pepe demo', 'Piazza Trilussa']
      }
    ],
    isActive: true,
    createdAt: '2024-12-01T09:00:00Z'
  },
  {
    id: 'guide-005',
    guideId: 'GC-G-100005',
    username: 'paris_flaneur',
    fullName: 'Camille Laurent',
    email: 'camille.l@guideconnect.travel',
    phone: '+33 1 42 68 11 09',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    bio: 'Art historian guiding tailored walks across Montmartre, Marais galleries, and secret passages of the Left Bank.',
    languages: [
      { language: 'French', proficiency: 'NATIVE' },
      { language: 'English', proficiency: 'FLUENT' },
      { language: 'Spanish', proficiency: 'FLUENT' }
    ],
    serviceAreas: ['Paris', 'Montmartre', 'Le Marais', 'Latin Quarter'],
    country: 'France',
    specializations: ['Cultural', 'Historical', 'Custom'],
    yearsOfExperience: 4,
    qualifications: ['Sorbonne Master of Art History'],
    baseHourlyRate: 38,
    currency: 'EUR',
    isVerified: false, // In verification review
    verificationDocument: 'IDF-ID-CARD-SCAN.pdf',
    rating: 4.80,
    reviewCount: 15,
    workingHours: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', isActive: true }
    ],
    blackoutDates: [],
    maxBookingsPerDay: 2,
    portfolio: [
      {
        id: 'port-040',
        title: 'Montmartre Bohemian Artists & Windmills Walk',
        description: 'Follow the footsteps of Picasso, Van Gogh, and Renoir through cobblestone staircases and hidden hillside vineyards.',
        imageUrl: '/src/assets/images/hero_cultural_exploration_1791808671160.jpg',
        location: 'Montmartre, Paris',
        duration: '3.5 Hours',
        highlights: ['Bateau-Lavoir artist studios', 'Clos Montmartre vineyard', 'Sacré-Cœur panorama']
      },
      {
        id: 'port-041',
        title: 'Le Marais Secret Passages & Aristocratic Mansions',
        description: 'Discover Renaissance courtyards, Jewish quarter delicacies, and the stunning Place des Vosges arcade.',
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
        location: 'Le Marais, Paris',
        duration: '4 Hours',
        highlights: ['Place des Vosges', 'Hotel de Sully gardens', 'Historic Rue des Rosiers']
      }
    ],
    isActive: true,
    createdAt: '2025-02-18T14:00:00Z'
  },
  {
    id: 'guide-006',
    guideId: 'GC-G-100006',
    username: 'swarajya_suresh',
    fullName: 'Suresh Deshmukh',
    email: 'suresh.deshmukh@guideconnect.travel',
    phone: '+91 98220 18452',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    bio: 'Veteran Maharashtra Tourism (MTDC) licensed master docent with 10 years of expertise across Maratha Empire forts, Sahyadri mountain trails, and Deccan heritage. Passionate about Marathi folklore, Chhatrapati Shivaji Maharaj history, and Western Ghats ecology.',
    languages: [
      { language: 'Marathi', proficiency: 'NATIVE' },
      { language: 'Hindi', proficiency: 'NATIVE' },
      { language: 'English', proficiency: 'FLUENT' }
    ],
    serviceAreas: ['Mumbai', 'Pune', 'Lonavala & Khandala', 'Raigad Fort', 'Chhatrapati Sambhajinagar'],
    country: 'India',
    specializations: ['Historical', 'Heritage & Architecture', 'Cultural', 'Trekking & Forts'],
    yearsOfExperience: 10,
    qualifications: ['MTDC Certified Master Docent #MH-DOC-2041', 'Archaeological Survey of India Accredited', 'Sahyadri Mountaineering Guide License'],
    baseHourlyRate: 700,
    currency: 'INR',
    isVerified: true,
    verificationDocument: 'MTDC-LIC-2041.pdf',
    rating: 4.97,
    reviewCount: 58,
    workingHours: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 1, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 2, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 3, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 4, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 5, startTime: '08:00', endTime: '19:00', isActive: true },
      { dayOfWeek: 6, startTime: '08:00', endTime: '19:00', isActive: true }
    ],
    blackoutDates: [],
    maxBookingsPerDay: 2,
    portfolio: [
      {
        id: 'port-020',
        title: 'Maratha Empire Forts & Sahyadri Royal Trails',
        description: 'In-depth docent trek through historic mountain fortresses of Shivaji Maharaj, exploring 17th-century bastion engineering, water cistern systems, and royal court architecture.',
        imageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f4438186?auto=format&fit=crop&w=600&q=80',
        location: 'Raigad & Pune Forts, Maharashtra',
        duration: '6 Hours',
        highlights: ['Shivaji Maharaj coronation ground', 'Sahyadri mountain vistas', '17th-century military bastions', 'Traditional Marathi Pithla Bhakri lunch']
      },
      {
        id: 'port-021',
        title: 'Pune Shaniwar Wada & Peshwa Heritage Walk',
        description: 'Walking through the heart of Old Pune exploring the 18th-century Shaniwar Wada palace seat, traditional wooden wadas, and historical markets.',
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
        location: 'Old Pune & Kasba Peth',
        duration: '4 Hours',
        highlights: ['Shaniwar Wada Palace', 'Kasba Ganpati Temple', 'Vishrambaug Wada woodwork', 'Chitale Bandhu Bakarwadi tasting']
      }
    ],
    isActive: true,
    createdAt: '2025-01-10T08:00:00Z'
  },
  {
    id: 'guide-007',
    guideId: 'GC-G-100007',
    username: 'ananya_mumbai_tales',
    fullName: 'Ananya Kulkarni',
    email: 'ananya.kulkarni@guideconnect.travel',
    phone: '+91 98190 77341',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    bio: 'Mumbai-born cultural researcher and Ministry of Tourism licensed docent. Specializes in Girgaon traditional wadas, Marathi literary theater, and iconic coastal street cuisine.',
    languages: [
      { language: 'Marathi', proficiency: 'NATIVE' },
      { language: 'English', proficiency: 'FLUENT' },
      { language: 'Hindi', proficiency: 'FLUENT' },
      { language: 'French', proficiency: 'CONVERSATIONAL' }
    ],
    serviceAreas: ['Mumbai', 'Girgaon', 'Dadar', 'South Mumbai', 'Kala Ghoda'],
    country: 'India',
    specializations: ['Cultural', 'Street Food', 'Art & Literature', 'Heritage & Architecture'],
    yearsOfExperience: 7,
    qualifications: ['Ministry of Tourism Lic. #IN-MH-9412', 'M.A. Ancient Indian History, Culture & Archaeology'],
    baseHourlyRate: 650,
    currency: 'INR',
    isVerified: true,
    verificationDocument: 'IN-MH-LIC-9412.pdf',
    rating: 4.94,
    reviewCount: 46,
    workingHours: [
      { dayOfWeek: 0, startTime: '08:30', endTime: '19:30', isActive: true },
      { dayOfWeek: 1, startTime: '08:30', endTime: '19:30', isActive: true },
      { dayOfWeek: 2, startTime: '08:30', endTime: '19:30', isActive: true },
      { dayOfWeek: 3, startTime: '08:30', endTime: '19:30', isActive: true },
      { dayOfWeek: 4, startTime: '08:30', endTime: '19:30', isActive: true },
      { dayOfWeek: 5, startTime: '08:30', endTime: '20:00', isActive: true },
      { dayOfWeek: 6, startTime: '08:30', endTime: '20:00', isActive: true }
    ],
    blackoutDates: [],
    maxBookingsPerDay: 2,
    portfolio: [
      {
        id: 'port-022',
        title: 'Girgaon & Dadar Cultural Odyssey: Marathi Heritage & Street Flavors',
        description: 'Immersive docent walk through historic Marathi neighborhoods, exploring traditional chawls and wadas, historic printing presses, and classic Maharashtrian delicacies.',
        imageUrl: '/src/assets/images/destination_mumbai_heritage_1791808690908.jpg',
        location: 'Girgaon & Dadar, Mumbai',
        duration: '3.5 Hours',
        highlights: ['Khotachiwadi heritage village', 'Authentic Kothimbir Vadi & Thalipeeth', '100-year-old literary institutions', 'Marine Drive Queen\'s Necklace view']
      },
      {
        id: 'port-023',
        title: 'Kala Ghoda Art Galleries & Heritage Streetscapes',
        description: 'Curated visual arts and historical walk connecting Gothic synagogues, contemporary art galleries, and historic David Sassoon library.',
        imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
        location: 'Kala Ghoda & Fort, Mumbai',
        duration: '3 Hours',
        highlights: ['Jehangir Art Gallery', 'David Sassoon Library heritage reading room', 'Art Deco street facades', 'Artisanal cafe stops']
      }
    ],
    isActive: true,
    createdAt: '2025-01-22T09:00:00Z'
  }
];

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'client-001',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@traveler.com',
    phone: '+1 416 555 0192',
    nationality: 'Canada',
    preferredLanguage: 'English',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    createdAt: '2025-01-20T10:00:00Z'
  },
  {
    id: 'client-002',
    fullName: 'Jean-Pierre Dubois',
    email: 'jp.dubois@voyageur.fr',
    phone: '+33 6 12 34 56 78',
    nationality: 'France',
    preferredLanguage: 'French',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    createdAt: '2025-02-10T11:00:00Z'
  },
  {
    id: 'client-003',
    fullName: 'Tushar Chavan',
    email: 'tusharchavan1234u7@gmail.com',
    phone: '+91 7710886640',
    nationality: 'India',
    preferredLanguage: 'Marathi',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    createdAt: '2025-02-15T09:00:00Z'
  },
  {
    id: 'client-004',
    fullName: 'Rohan Dasari',
    email: 'newstartcod2007@gmail.com',
    phone: '+91 9766884243',
    nationality: 'India',
    preferredLanguage: 'English',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    createdAt: '2025-02-20T11:30:00Z'
  },
  {
    id: 'client-005',
    fullName: 'Prince Gupta',
    email: 'guptaprince0408@gmail.com',
    phone: '+91 8108064052',
    nationality: 'India',
    preferredLanguage: 'Hindi',
    profilePhoto: '/assets/aistudio/WhatsApp_Image_2026-10-21_at_12.59.24_ff55a0e1.jpeg',
    createdAt: '2025-02-25T14:15:00Z'
  },
  {
    id: 'client-006',
    fullName: 'Vedant Ruchke',
    email: 'vedantruchke07@gmail.com',
    phone: '+91 99874 55046',
    nationality: 'India',
    preferredLanguage: 'Marathi',
    profilePhoto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    createdAt: '2025-03-01T10:00:00Z'
  },
  {
    id: 'client-007',
    fullName: 'Prachi Bhere',
    email: 'prachibhere3@gmail.com',
    phone: '+91 73507 55376',
    nationality: 'India',
    preferredLanguage: 'Marathi',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    createdAt: '2025-03-05T12:00:00Z'
  },
  {
    id: 'client-008',
    fullName: 'Deepti Bhere',
    email: 'deeptibhere07@gmail.com',
    phone: '+91 724 906 8205',
    nationality: 'India',
    preferredLanguage: 'Marathi',
    profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    createdAt: '2025-03-10T15:30:00Z'
  }
];

// Initial seed requests
export const INITIAL_REQUESTS: ClientRequest[] = [
  {
    id: 'REQ-2026-1001',
    clientId: 'client-001',
    clientName: 'Elena Rostova',
    clientNationality: 'Canada',
    destinationCountry: 'India',
    destinationCity: 'Mumbai',
    preferredLanguage: 'English',
    additionalLanguages: ['French'],
    travelDate: '2026-10-20',
    startTime: '10:00',
    endTime: '14:00',
    durationHours: 4,
    numberOfTourists: 2,
    tourType: 'Historical',
    preferredSpecialization: 'Heritage & Architecture',
    approximateBudget: 3200,
    currency: 'INR',
    meetingLocation: 'Gateway of India, Jetty Entrance #2',
    specialInstructions: 'Interested in Victorian Gothic architecture, Taj Mahal Palace heritage, and colonial naval history.',
    status: 'OPEN',
    version: 1,
    createdAt: '2026-10-12T04:15:00Z'
  },
  {
    id: 'REQ-2026-0988',
    clientId: 'client-001',
    clientName: 'Elena Rostova',
    clientNationality: 'Canada',
    destinationCountry: 'Japan',
    destinationCity: 'Kyoto',
    preferredLanguage: 'English',
    travelDate: '2026-10-15',
    startTime: '09:00',
    endTime: '13:00',
    durationHours: 4,
    numberOfTourists: 2,
    tourType: 'Cultural',
    preferredSpecialization: 'Temples & Tea Ceremonies',
    approximateBudget: 16000,
    currency: 'JPY',
    meetingLocation: 'Gion-Shijo Station, Exit 6',
    specialInstructions: 'Visiting Kennin-ji Zen temple and walking preserved preservation streets.',
    status: 'ACCEPTED',
    assignedGuideId: 'guide-003',
    assignedGuideUsername: 'kyoto_zen_walker',
    bookingId: 'BK-2026-0039',
    version: 2,
    createdAt: '2026-10-08T09:00:00Z',
    acceptedAt: '2026-10-08T09:45:12Z'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'BK-2026-0039',
    requestId: 'REQ-2026-0988',
    clientId: 'client-001',
    clientName: 'Elena Rostova',
    guideId: 'guide-003',
    guideCode: 'GC-G-100003',
    guideUsername: 'kyoto_zen_walker',
    destinationCity: 'Kyoto',
    travelDate: '2026-10-15',
    startTime: '09:00',
    endTime: '13:00',
    durationHours: 4,
    numberOfTourists: 2,
    tourType: 'Cultural',
    meetingLocation: 'Gion-Shijo Station, Exit 6',
    estimatedPriceMin: 14500,
    estimatedPriceMax: 19800,
    agreedPrice: 16000,
    currency: 'JPY',
    bookingStatus: 'CONFIRMED',
    negotiationStatus: 'AGREED',
    createdAt: '2026-10-08T09:45:12Z'
  }
];

export const INITIAL_INVITATIONS: RequestInvitation[] = [
  {
    id: 'INV-1001-001',
    requestId: 'REQ-2026-1001',
    guideId: 'guide-001',
    guideCode: 'GC-G-100001',
    status: 'PENDING',
    invitedAt: '2026-10-12T04:15:00Z'
  },
  {
    id: 'INV-1001-002',
    requestId: 'REQ-2026-1001',
    guideId: 'guide-002',
    guideCode: 'GC-G-100002',
    status: 'PENDING',
    invitedAt: '2026-10-12T04:15:00Z'
  },
  {
    id: 'INV-0988-003',
    requestId: 'REQ-2026-0988',
    guideId: 'guide-003',
    guideCode: 'GC-G-100003',
    status: 'ACCEPTED',
    invitedAt: '2026-10-08T09:00:00Z',
    respondedAt: '2026-10-08T09:45:12Z'
  }
];

export const INITIAL_OFFERS: NegotiationOffer[] = [
  {
    id: 'OFFER-001',
    bookingId: 'BK-2026-0039',
    requestId: 'REQ-2026-0988',
    senderRole: 'GUIDE',
    senderId: 'guide-003',
    senderName: 'Kenji Tanaka',
    proposedAmount: 17500,
    currency: 'JPY',
    note: 'Standard 4-hour immersive cultural walk with temple admission guidance.',
    status: 'SUPERSEDED',
    createdAt: '2026-10-08T10:00:00Z'
  },
  {
    id: 'OFFER-002',
    bookingId: 'BK-2026-0039',
    requestId: 'REQ-2026-0988',
    senderRole: 'CLIENT',
    senderId: 'client-001',
    senderName: 'Elena Rostova',
    proposedAmount: 16000,
    currency: 'JPY',
    note: 'Would you be open to 16,000 JPY for 2 travelers?',
    status: 'ACCEPTED',
    createdAt: '2026-10-08T10:15:00Z'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'MSG-001',
    bookingId: 'BK-2026-0039',
    senderId: 'guide-003',
    senderRole: 'GUIDE',
    senderName: 'Kenji Tanaka',
    content: 'Konnichiwa Elena! Looking forward to showing you the historic alleys of Gion and Kennin-ji. I will hold a GuideConnect signboard outside Exit 6.',
    timestamp: '2026-10-08T10:30:00Z',
    isRead: true
  },
  {
    id: 'MSG-002',
    bookingId: 'BK-2026-0039',
    senderId: 'client-001',
    senderRole: 'CLIENT',
    senderName: 'Elena Rostova',
    content: 'Thank you Kenji! Looking forward to it. We will be wearing blue backpacks.',
    timestamp: '2026-10-08T11:05:00Z',
    isRead: true
  }
];

export const INITIAL_REVIEWS: Review[] = [
  // Aarav Mehta (guide-001) historical reviews
  {
    id: 'REV-001',
    bookingId: 'BK-PREV-0010',
    clientId: 'client-002',
    clientName: 'Liam O’Connor',
    clientNationality: 'Ireland',
    guideId: 'guide-001',
    rating: 4.8,
    comment: 'First tour with Aarav through the Crawford Market spice alleys. Invaluable local tips and cultural context.',
    createdAt: '2026-03-12T11:00:00Z'
  },
  {
    id: 'REV-002',
    bookingId: 'BK-PREV-0011',
    clientId: 'client-001',
    clientName: 'Sophie Van Der Berg',
    clientNationality: 'Netherlands',
    guideId: 'guide-001',
    rating: 4.9,
    comment: 'Brilliant walking lecture on Victorian Gothic architecture. Very punctual and accommodated our slower pace.',
    createdAt: '2026-04-20T15:30:00Z'
  },
  {
    id: 'REV-003',
    bookingId: 'BK-PREV-0012',
    clientId: 'client-001',
    clientName: 'Elena Rostova',
    clientNationality: 'Canada',
    guideId: 'guide-001',
    rating: 5.0,
    comment: 'Aarav is an extraordinary guide! His knowledge of Mumbai heritage, architecture, and hidden dockside history brought the city alive.',
    createdAt: '2026-06-15T16:00:00Z'
  },
  {
    id: 'REV-004',
    bookingId: 'BK-PREV-0013',
    clientId: 'client-002',
    clientName: 'Marcus Bennett',
    clientNationality: 'United Kingdom',
    guideId: 'guide-001',
    rating: 5.0,
    comment: 'Impeccable communication and historical depth. Even our teenage kids remained thoroughly engaged.',
    createdAt: '2026-07-28T14:15:00Z'
  },
  {
    id: 'REV-005',
    bookingId: 'BK-PREV-0014',
    clientId: 'client-001',
    clientName: 'Aiko Takahashi',
    clientNationality: 'Japan',
    guideId: 'guide-001',
    rating: 4.9,
    comment: 'Very polite, safe navigation through crowded streets, and authentic street tea stalls that were spotlessly clean.',
    createdAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'REV-006',
    bookingId: 'BK-PREV-0015',
    clientId: 'client-002',
    clientName: 'Francois Dupont',
    clientNationality: 'France',
    guideId: 'guide-001',
    rating: 5.0,
    comment: 'Parle un français remarquable! Elephanta caves tour was unforgettable.',
    createdAt: '2026-10-04T13:45:00Z'
  },

  // Sahil Deshmukh (guide-002) historical reviews
  {
    id: 'REV-010',
    bookingId: 'BK-PREV-0020',
    clientId: 'client-001',
    clientName: 'Jonas Weber',
    clientNationality: 'Germany',
    guideId: 'guide-002',
    rating: 4.7,
    comment: 'Sahil sprach fließend Deutsch und führte uns sicher durch die Kolonialviertel.',
    createdAt: '2026-04-18T14:00:00Z'
  },
  {
    id: 'REV-011',
    bookingId: 'BK-PREV-0021',
    clientId: 'client-002',
    clientName: 'Claire Martin',
    clientNationality: 'France',
    guideId: 'guide-002',
    rating: 4.8,
    comment: 'Great culinary stops at Bandra, passionate storytelling and friendly attitude.',
    createdAt: '2026-06-25T17:30:00Z'
  },
  {
    id: 'REV-012',
    bookingId: 'BK-PREV-0022',
    clientId: 'client-001',
    clientName: 'David Miller',
    clientNationality: 'USA',
    guideId: 'guide-002',
    rating: 5.0,
    comment: 'Sahil took us to secret spots no bus tour would ever see. 10/10 recommend.',
    createdAt: '2026-08-30T16:00:00Z'
  },
  {
    id: 'REV-013',
    bookingId: 'BK-PREV-0023',
    clientId: 'client-002',
    clientName: 'Lukas Gruber',
    clientNationality: 'Austria',
    guideId: 'guide-002',
    rating: 4.9,
    comment: 'Very polite, answered all our complex architectural questions with ease.',
    createdAt: '2026-09-28T11:20:00Z'
  },

  // Kenji Tanaka (guide-003) historical reviews
  {
    id: 'REV-020',
    bookingId: 'BK-PREV-0030',
    clientId: 'client-001',
    clientName: 'Mateo Hernandez',
    clientNationality: 'Spain',
    guideId: 'guide-003',
    rating: 4.9,
    comment: 'Excelente guía en Kioto. Explicó los templos Zen con serenidad y profundidad.',
    createdAt: '2026-03-05T09:30:00Z'
  },
  {
    id: 'REV-021',
    bookingId: 'BK-PREV-0031',
    clientId: 'client-002',
    clientName: 'Emma Watson',
    clientNationality: 'UK',
    guideId: 'guide-003',
    rating: 5.0,
    comment: 'Kenji has rare access and knowledge. The early morning tea sanctuary walk in Arashiyama was pure magic.',
    createdAt: '2026-05-14T08:00:00Z'
  },
  {
    id: 'REV-022',
    bookingId: 'BK-PREV-0032',
    clientId: 'client-001',
    clientName: 'Elena Rostova',
    clientNationality: 'Canada',
    guideId: 'guide-003',
    rating: 5.0,
    comment: 'Kennin-ji Zen temple tour was peaceful and educational. Kenji is a master docent.',
    createdAt: '2026-07-22T10:15:00Z'
  },
  {
    id: 'REV-023',
    bookingId: 'BK-PREV-0033',
    clientId: 'client-002',
    clientName: 'Noah Zimmer',
    clientNationality: 'Switzerland',
    guideId: 'guide-003',
    rating: 5.0,
    comment: 'Flawless English, profound respect for Japanese traditions, and great photo spots.',
    createdAt: '2026-09-18T13:00:00Z'
  },

  // Matteo Rossi (guide-004) historical reviews
  {
    id: 'REV-030',
    bookingId: 'BK-PREV-0040',
    clientId: 'client-001',
    clientName: 'Sarah Jenkins',
    clientNationality: 'Australia',
    guideId: 'guide-004',
    rating: 4.8,
    comment: 'Matteo brought the Roman forum to life. You could almost hear the emperors speaking.',
    createdAt: '2026-04-10T14:00:00Z'
  },
  {
    id: 'REV-031',
    bookingId: 'BK-PREV-0041',
    clientId: 'client-002',
    clientName: 'Jean-Pierre Dubois',
    clientNationality: 'France',
    guideId: 'guide-004',
    rating: 5.0,
    comment: 'Matteo made Rome’s ruins come alive. Fluent in French and English, he navigated us through the Colosseum underground effortlessly.',
    createdAt: '2026-06-22T14:30:00Z'
  },
  {
    id: 'REV-032',
    bookingId: 'BK-PREV-0042',
    clientId: 'client-001',
    clientName: 'Hans Becker',
    clientNationality: 'Germany',
    guideId: 'guide-004',
    rating: 4.9,
    comment: 'Archaeology background shows in every detail. Skip-the-line coordination was seamless.',
    createdAt: '2026-08-19T09:45:00Z'
  },
  {
    id: 'REV-033',
    bookingId: 'BK-PREV-0043',
    clientId: 'client-002',
    clientName: 'Lucia Bianchi',
    clientNationality: 'Italy',
    guideId: 'guide-004',
    rating: 5.0,
    comment: 'Guida straordinaria! Consigliatissimo per famiglie e studiosi.',
    createdAt: '2026-10-01T15:20:00Z'
  },

  // Camille Laurent (guide-005) historical reviews
  {
    id: 'REV-040',
    bookingId: 'BK-PREV-0050',
    clientId: 'client-001',
    clientName: 'Chloe Bennett',
    clientNationality: 'USA',
    guideId: 'guide-005',
    rating: 4.7,
    comment: 'Art history tour through Montmartre was charming and insightful.',
    createdAt: '2026-05-12T11:00:00Z'
  },
  {
    id: 'REV-041',
    bookingId: 'BK-PREV-0051',
    clientId: 'client-002',
    clientName: 'Carlos Ruiz',
    clientNationality: 'Spain',
    guideId: 'guide-005',
    rating: 4.8,
    comment: 'Camille es muy amable y conoce los rincones secretos de París.',
    createdAt: '2026-07-16T15:00:00Z'
  },
  {
    id: 'REV-042',
    bookingId: 'BK-PREV-0052',
    clientId: 'client-001',
    clientName: 'David Lee',
    clientNationality: 'Singapore',
    guideId: 'guide-005',
    rating: 4.9,
    comment: 'Fabulous gallery curation in Le Marais. Very pleasant conversational style.',
    createdAt: '2026-09-24T14:30:00Z'
  },

  // Suresh Deshmukh (guide-006) historical reviews
  {
    id: 'REV-050',
    bookingId: 'BK-PREV-0060',
    clientId: 'client-003',
    clientName: 'Tushar Chavan',
    clientNationality: 'India',
    guideId: 'guide-006',
    rating: 5.0,
    comment: 'सुरेश सरांनी रायगड किल्ल्याचा इतिहास अत्यंत जिवंतपणे उलगडला. मराठीतील स्पष्ट उच्चार आणि खोल अभ्यास अप्रतिम आहे!',
    createdAt: '2026-05-18T16:00:00Z'
  },
  {
    id: 'REV-051',
    bookingId: 'BK-PREV-0061',
    clientId: 'client-005',
    clientName: 'Prince Gupta',
    clientNationality: 'India',
    guideId: 'guide-006',
    rating: 5.0,
    comment: 'Suresh ji has exceptional knowledge of Maratha fort architecture and Deccan history. Very patient, punctual, and engaging storyteller.',
    createdAt: '2026-07-20T12:00:00Z'
  },
  {
    id: 'REV-052',
    bookingId: 'BK-PREV-0062',
    clientId: 'client-006',
    clientName: 'Vedant Ruchke',
    clientNationality: 'India',
    guideId: 'guide-006',
    rating: 4.9,
    comment: 'शनिवार वाडा आणि जुन्या पुण्याच्या वाड्यांची सफर अविस्मरणीय झाली. अस्सल महाराष्ट्रीयन जेवणाची सोयही छान होती.',
    createdAt: '2026-09-05T15:30:00Z'
  },

  // Ananya Kulkarni (guide-007) historical reviews
  {
    id: 'REV-060',
    bookingId: 'BK-PREV-0070',
    clientId: 'client-007',
    clientName: 'Prachi Bhere',
    clientNationality: 'India',
    guideId: 'guide-007',
    rating: 5.0,
    comment: 'अनन्या सोबत गिरगाव आणि दादर ची हेरिटेज वॉक अतिशय सुंदर झाली! मराठी संस्कृती, जुने वाडे आणि चवदार खाद्यसंस्कृतीचा अनुभव सुरेख होता.',
    createdAt: '2026-06-14T11:00:00Z'
  },
  {
    id: 'REV-061',
    bookingId: 'BK-PREV-0071',
    clientId: 'client-004',
    clientName: 'Rohan Dasari',
    clientNationality: 'India',
    guideId: 'guide-007',
    rating: 4.9,
    comment: 'Fascinating tour of South Bombay and Kala Ghoda! Ananya seamlessly blends Marathi cultural nuances with architectural heritage.',
    createdAt: '2026-08-11T16:30:00Z'
  },
  {
    id: 'REV-062',
    bookingId: 'BK-PREV-0072',
    clientId: 'client-008',
    clientName: 'Deepti Bhere',
    clientNationality: 'India',
    guideId: 'guide-007',
    rating: 5.0,
    comment: 'मराठी भाषेतील इतकी माहितीपूर्ण आणि आत्मीयतेने केलेली सफर खूप आवडली. प्रत्येकाने अवश्य अनुभव घ्यावा!',
    createdAt: '2026-10-02T14:00:00Z'
  }
];

export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
}

export function buildGmailLink(toEmail: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  // Elena Rostova (client-001) notified about accepted tour in Kyoto
  {
    id: 'NOTIF-001',
    recipientId: 'client-001',
    recipientRole: 'CLIENT',
    recipientName: 'Elena Rostova',
    recipientEmail: 'elena.rostova@traveler.com',
    recipientPhone: '+1 416 555 0192',
    title: 'Tour Confirmed! Kenji Tanaka Accepted Your Request',
    message: 'Kenji Tanaka (@kyoto_zen_walker) has accepted your Kyoto cultural tour on 2026-10-15 (09:00 - 13:00). Meeting location: Gion-Shijo Station, Exit 6. Booking ID: BK-2026-0039.',
    channel: 'WHATSAPP',
    type: 'REQUEST_ACCEPTED',
    referenceId: 'BK-2026-0039',
    timestamp: '2026-10-08T09:45:12Z',
    isRead: false,
    externalLink: buildWhatsAppLink('+1 416 555 0192', 'Tour Confirmed! Guide Kenji Tanaka (+81 75 491 8820) accepted booking BK-2026-0039 for Kyoto on 2026-10-15.'),
    details: {
      tourDate: '2026-10-15',
      destinationCity: 'Kyoto',
      guideName: 'Kenji Tanaka',
      guidePhone: '+81 75 491 8820',
      guideCode: 'GC-G-100003',
      guideUsername: 'kyoto_zen_walker',
      clientName: 'Elena Rostova',
      clientPhone: '+1 416 555 0192',
      clientEmail: 'elena.rostova@traveler.com',
      meetingLocation: 'Gion-Shijo Station, Exit 6',
      agreedPrice: 16000,
      currency: 'JPY'
    }
  },
  {
    id: 'NOTIF-002',
    recipientId: 'client-001',
    recipientRole: 'CLIENT',
    recipientName: 'Elena Rostova',
    recipientEmail: 'elena.rostova@traveler.com',
    recipientPhone: '+1 416 555 0192',
    title: 'Booking Confirmation Email Dispatched',
    message: 'Official confirmation summary sent to elena.rostova@traveler.com for your Kyoto tour with Kenji Tanaka.',
    channel: 'GMAIL',
    type: 'REQUEST_ACCEPTED',
    referenceId: 'BK-2026-0039',
    timestamp: '2026-10-08T09:45:15Z',
    isRead: true,
    externalLink: buildGmailLink('elena.rostova@traveler.com', 'Booking Confirmed: Kyoto Tour with Kenji Tanaka [BK-2026-0039]', 'Tour details with guide Kenji Tanaka (+81 75 491 8820)...'),
    details: {
      tourDate: '2026-10-15',
      destinationCity: 'Kyoto',
      guideName: 'Kenji Tanaka',
      guidePhone: '+81 75 491 8820',
      guideCode: 'GC-G-100003',
      guideUsername: 'kyoto_zen_walker',
      clientName: 'Elena Rostova',
      clientPhone: '+1 416 555 0192',
      clientEmail: 'elena.rostova@traveler.com',
      meetingLocation: 'Gion-Shijo Station, Exit 6',
      agreedPrice: 16000,
      currency: 'JPY'
    }
  },
  // Aarav Mehta (guide-001) notified about Elena's Mumbai request
  {
    id: 'NOTIF-003',
    recipientId: 'guide-001',
    recipientRole: 'GUIDE',
    recipientName: 'Aarav Mehta',
    recipientEmail: 'aarav.mehta@guideconnect.travel',
    recipientPhone: '+91 98201 44521',
    title: 'New Tour Request: Elena Rostova (Mumbai)',
    message: 'Elena Rostova submitted a request for Historical / Heritage & Architecture tour in Mumbai on 2026-10-20 (10:00 - 14:00) at Gateway of India. Budget: INR 3,200.',
    channel: 'IN_APP',
    type: 'REQUEST_CREATED',
    referenceId: 'REQ-2026-1001',
    timestamp: '2026-10-12T04:15:00Z',
    isRead: false,
    details: {
      tourDate: '2026-10-20',
      destinationCity: 'Mumbai',
      clientName: 'Elena Rostova',
      clientPhone: '+1 416 555 0192',
      clientEmail: 'elena.rostova@traveler.com',
      meetingLocation: 'Gateway of India, Jetty Entrance #2',
      currency: 'INR'
    }
  },
  {
    id: 'NOTIF-004',
    recipientId: 'guide-001',
    recipientRole: 'GUIDE',
    recipientName: 'Aarav Mehta',
    recipientEmail: 'aarav.mehta@guideconnect.travel',
    recipientPhone: '+91 98201 44521',
    title: 'WhatsApp Alert: New Tour Request in Mumbai',
    message: 'Elena Rostova has requested a tour matching your Mumbai docent profile. You can accept to claim this booking.',
    channel: 'WHATSAPP',
    type: 'REQUEST_CREATED',
    referenceId: 'REQ-2026-1001',
    timestamp: '2026-10-12T04:15:02Z',
    isRead: false,
    externalLink: buildWhatsAppLink('+91 98201 44521', 'GuideConnect Alert: Elena Rostova requested a Mumbai tour on 2026-10-20. Open app to accept.'),
    details: {
      tourDate: '2026-10-20',
      destinationCity: 'Mumbai',
      clientName: 'Elena Rostova',
      clientPhone: '+1 416 555 0192',
      meetingLocation: 'Gateway of India, Jetty Entrance #2',
      currency: 'INR'
    }
  }
];

// Helper to load or initialize state
function loadInitialState(): DatabaseState {
  if (typeof window === 'undefined') {
    return {
      guides: INITIAL_GUIDES,
      clients: INITIAL_CLIENTS,
      requests: INITIAL_REQUESTS,
      invitations: INITIAL_INVITATIONS,
      bookings: INITIAL_BOOKINGS,
      offers: INITIAL_OFFERS,
      messages: INITIAL_MESSAGES,
      reviews: INITIAL_REVIEWS,
      pricingRules: DEFAULT_PRICING_RULES,
      auditLogs: [],
      notifications: INITIAL_NOTIFICATIONS,
      nextGuideSequence: 100008
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all initial clients are present
      INITIAL_CLIENTS.forEach(initClient => {
        const existingIdx = parsed.clients.findIndex((c: ClientProfile) => c.id === initClient.id || c.fullName.toLowerCase() === initClient.fullName.toLowerCase());
        if (existingIdx === -1) {
          parsed.clients.push(initClient);
        } else {
          // Keep credentials up to date with real user contacts
          parsed.clients[existingIdx].email = initClient.email;
          parsed.clients[existingIdx].phone = initClient.phone;
          if (initClient.id === 'client-005') {
            parsed.clients[existingIdx].profilePhoto = initClient.profilePhoto;
          }
        }
      });
      // Ensure all initial guides are present
      INITIAL_GUIDES.forEach(initGuide => {
        if (!parsed.guides.some((g: GuideProfile) => g.id === initGuide.id || g.guideId === initGuide.guideId)) {
          parsed.guides.push(initGuide);
        }
      });
      // If cached data has older minimal reviews, ensure initial reviews are present
      if (!parsed.reviews || parsed.reviews.length < INITIAL_REVIEWS.length) {
        parsed.reviews = INITIAL_REVIEWS;
      }
      if (!parsed.notifications || parsed.notifications.length === 0) {
        parsed.notifications = INITIAL_NOTIFICATIONS;
      }
      if (!parsed.nextGuideSequence || parsed.nextGuideSequence < 100008) {
        parsed.nextGuideSequence = 100008;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse saved db state', err);
  }

  const fresh: DatabaseState = {
    guides: INITIAL_GUIDES,
    clients: INITIAL_CLIENTS,
    requests: INITIAL_REQUESTS,
    invitations: INITIAL_INVITATIONS,
    bookings: INITIAL_BOOKINGS,
    offers: INITIAL_OFFERS,
    messages: INITIAL_MESSAGES,
    reviews: INITIAL_REVIEWS,
    pricingRules: DEFAULT_PRICING_RULES,
    auditLogs: [],
    notifications: INITIAL_NOTIFICATIONS,
    nextGuideSequence: 100008
  };
  saveState(fresh);
  return fresh;
}

function saveState(state: DatabaseState) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to persist db state', err);
    }
  }
}

// Global in-memory instance
let state: DatabaseState = loadInitialState();
const listeners = new Set<() => void>();

function notify() {
  saveState(state);
  listeners.forEach(fn => fn());
}

export function subscribeStore(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getStoreState(): DatabaseState {
  return state;
}

export function resetStoreToDefaults() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  state = {
    guides: JSON.parse(JSON.stringify(INITIAL_GUIDES)),
    clients: JSON.parse(JSON.stringify(INITIAL_CLIENTS)),
    requests: JSON.parse(JSON.stringify(INITIAL_REQUESTS)),
    invitations: JSON.parse(JSON.stringify(INITIAL_INVITATIONS)),
    bookings: JSON.parse(JSON.stringify(INITIAL_BOOKINGS)),
    offers: JSON.parse(JSON.stringify(INITIAL_OFFERS)),
    messages: JSON.parse(JSON.stringify(INITIAL_MESSAGES)),
    reviews: JSON.parse(JSON.stringify(INITIAL_REVIEWS)),
    pricingRules: JSON.parse(JSON.stringify(DEFAULT_PRICING_RULES)),
    auditLogs: [],
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    nextGuideSequence: 100008
  };
  notify();
}

// --- CLIENT REGISTRATION SYSTEM ---
export async function registerClient(data: {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  preferredLanguage: string;
  profilePhoto?: string;
}): Promise<{ success: boolean; client?: ClientProfile; error?: string }> {
  const unlock = await dbMutex.acquire();
  try {
    const trimmedName = data.fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters long.' };
    }
    const trimmedEmail = data.email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    const existing = state.clients.find(c => c.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, error: `Email "${data.email}" is already registered as a tourist.` };
    }
    const nextNum = state.clients.length + 1;
    const clientId = `client-${String(nextNum).padStart(3, '0')}`;
    const newClient: ClientProfile = {
      id: clientId,
      fullName: trimmedName,
      email: trimmedEmail,
      phone: data.phone.trim() || '+91 98000 00000',
      nationality: data.nationality.trim() || 'India',
      preferredLanguage: data.preferredLanguage.trim() || 'English',
      profilePhoto: data.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      createdAt: new Date().toISOString()
    };
    state.clients.push(newClient);
    notify();
    return { success: true, client: newClient };
  } finally {
    unlock();
  }
}

// --- CLIENT PROFILE UPDATE & ACCOUNT DELETION ---
export function updateClientProfile(
  clientId: string,
  updates: {
    fullName?: string;
    email?: string;
    phone?: string;
    nationality?: string;
    preferredLanguage?: string;
    profilePhoto?: string;
  }
): ClientProfile {
  const index = state.clients.findIndex(c => c.id === clientId);
  if (index === -1) {
    throw new Error('Client profile not found');
  }

  const existing = state.clients[index];
  const updated: ClientProfile = {
    ...existing,
    ...updates,
    fullName: updates.fullName !== undefined && updates.fullName.trim() ? updates.fullName.trim() : existing.fullName,
    email: updates.email !== undefined && updates.email.trim() ? updates.email.trim().toLowerCase() : existing.email,
    phone: updates.phone !== undefined && updates.phone.trim() ? updates.phone.trim() : existing.phone,
    nationality: updates.nationality !== undefined && updates.nationality.trim() ? updates.nationality.trim() : existing.nationality,
    preferredLanguage: updates.preferredLanguage !== undefined && updates.preferredLanguage.trim() ? updates.preferredLanguage.trim() : existing.preferredLanguage,
    profilePhoto: updates.profilePhoto !== undefined && updates.profilePhoto.trim() ? updates.profilePhoto.trim() : existing.profilePhoto
  };

  state.clients[index] = updated;

  // Sync client name in open requests and bookings if full name changed
  if (updates.fullName && updates.fullName.trim() !== existing.fullName) {
    const newName = updates.fullName.trim();
    state.requests.forEach(r => {
      if (r.clientId === clientId) r.clientName = newName;
    });
    state.bookings.forEach(b => {
      if (b.clientId === clientId) b.clientName = newName;
    });
    state.reviews.forEach(rv => {
      if (rv.clientId === clientId) rv.clientName = newName;
    });
  }

  notify();
  return updated;
}

export function deleteClientAccount(clientId: string): { success: boolean; nextClientId?: string } {
  const index = state.clients.findIndex(c => c.id === clientId);
  if (index === -1) {
    return { success: false };
  }

  // Remove the client
  state.clients.splice(index, 1);

  // If no clients left, seed default
  if (state.clients.length === 0) {
    state.clients = JSON.parse(JSON.stringify(INITIAL_CLIENTS));
  }

  // Cancel or clean up open requests for this client
  state.requests = state.requests.filter(r => r.clientId !== clientId || r.status !== 'OPEN');

  // Clean up notifications for this client
  state.notifications = state.notifications.filter(n => n.recipientId !== clientId);

  const nextClientId = state.clients[0]?.id;
  notify();
  return { success: true, nextClientId };
}

// --- GUIDE PROFILE UPDATE & ACCOUNT DELETION ---
export function updateGuideProfile(
  guideId: string,
  updates: Partial<GuideProfile>
): GuideProfile {
  const index = state.guides.findIndex(g => g.id === guideId);
  if (index === -1) {
    throw new Error('Guide profile not found');
  }

  const existing = state.guides[index];
  const updated: GuideProfile = {
    ...existing,
    ...updates,
    fullName: updates.fullName !== undefined && updates.fullName.trim() ? updates.fullName.trim() : existing.fullName,
    username: updates.username !== undefined && updates.username.trim() ? updates.username.trim().replace(/^@/, '') : existing.username,
    email: updates.email !== undefined && updates.email.trim() ? updates.email.trim().toLowerCase() : existing.email,
    phone: updates.phone !== undefined && updates.phone.trim() ? updates.phone.trim() : existing.phone,
    bio: updates.bio !== undefined && updates.bio.trim() ? updates.bio.trim() : existing.bio,
    profilePhoto: updates.profilePhoto !== undefined && updates.profilePhoto.trim() ? updates.profilePhoto.trim() : existing.profilePhoto,
    baseHourlyRate: updates.baseHourlyRate !== undefined ? Number(updates.baseHourlyRate) : existing.baseHourlyRate,
    currency: updates.currency !== undefined && updates.currency.trim() ? updates.currency.trim() : existing.currency,
  };

  state.guides[index] = updated;

  // Sync guideUsername across bookings
  if (updates.username && updates.username.trim()) {
    const cleanUname = updates.username.trim().replace(/^@/, '');
    state.bookings.forEach(b => {
      if (b.guideId === guideId) b.guideUsername = cleanUname;
    });
  }

  // Sync senderName in offers if guide sent them
  if (updates.fullName && updates.fullName.trim() !== existing.fullName) {
    const newName = updates.fullName.trim();
    state.offers.forEach(o => {
      if (o.senderId === guideId) o.senderName = newName;
    });
  }

  notify();
  return updated;
}

export function deleteGuideAccount(guideId: string): { success: boolean; nextGuideId?: string } {
  const index = state.guides.findIndex(g => g.id === guideId);
  if (index === -1) {
    return { success: false };
  }

  state.guides.splice(index, 1);

  if (state.guides.length === 0) {
    state.guides = JSON.parse(JSON.stringify(INITIAL_GUIDES));
  }

  // Remove pending invitations for this guide
  state.invitations = state.invitations.filter(i => i.guideId !== guideId);
  state.notifications = state.notifications.filter(n => n.recipientId !== guideId);

  const nextGuideId = state.guides[0]?.id;
  notify();
  return { success: true, nextGuideId };
}

// --- GUIDE UNIQUE IDENTITY SYSTEM ---
// 1. Automatically Generated Guide ID: GC-G-100001, GC-G-100002...
// 2. Guide-chosen unique username
export async function registerGuide(data: {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  languages: { language: string; proficiency: 'NATIVE' | 'FLUENT' | 'CONVERSATIONAL' }[];
  serviceAreas: string[];
  country: string;
  specializations: string[];
  yearsOfExperience: number;
  qualifications: string[];
  baseHourlyRate: number;
  currency: string;
  bio: string;
  verificationDocument?: string;
}): Promise<{ success: boolean; guide?: GuideProfile; error?: string }> {
  const unlock = await dbMutex.acquire();
  try {
    const trimmedUsername = data.username.trim().toLowerCase();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }

    // Check unique username constraint
    const existingUser = state.guides.find(g => g.username.toLowerCase() === trimmedUsername);
    if (existingUser) {
      return { success: false, error: `Username "${data.username}" is already taken. Please choose another.` };
    }

    // Check duplicate email
    const existingEmail = state.guides.find(g => g.email.toLowerCase() === data.email.toLowerCase());
    if (existingEmail) {
      return { success: false, error: `Email address "${data.email}" is already registered.` };
    }

    // Automatically generate collision-free Guide ID e.g. "GC-G-100006"
    const seq = state.nextGuideSequence;
    const generatedGuideId = `GC-G-${seq}`;
    state.nextGuideSequence += 1;

    const newGuide: GuideProfile = {
      id: `guide-${Date.now()}`,
      guideId: generatedGuideId,
      username: trimmedUsername,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      profilePhoto: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&w=400&q=80`,
      bio: data.bio,
      languages: data.languages,
      serviceAreas: data.serviceAreas,
      country: data.country,
      specializations: data.specializations,
      yearsOfExperience: data.yearsOfExperience,
      qualifications: data.qualifications,
      baseHourlyRate: data.baseHourlyRate,
      currency: data.currency,
      isVerified: false, // New guides require verification
      verificationDocument: data.verificationDocument || 'ID_CERT_SUBMISSION.pdf',
      rating: 5.0,
      reviewCount: 0,
      workingHours: [
        { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isActive: true },
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isActive: true },
        { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isActive: true },
        { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isActive: true },
        { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', isActive: true },
        { dayOfWeek: 6, startTime: '09:00', endTime: '19:00', isActive: true }
      ],
      blackoutDates: [],
      maxBookingsPerDay: 2,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    state.guides.push(newGuide);
    notify();
    return { success: true, guide: newGuide };
  } finally {
    unlock();
  }
}



// Update Guide Working Hours & Blackout Dates
export function updateGuideAvailability(
  guideId: string,
  workingHours: GuideProfile['workingHours'],
  blackoutDates: GuideProfile['blackoutDates']
): boolean {
  const guide = state.guides.find(g => g.id === guideId);
  if (!guide) return false;
  guide.workingHours = workingHours;
  guide.blackoutDates = blackoutDates;
  notify();
  return true;
}

// --- CLIENT REQUEST CREATION & SMART MATCHING ENGINE ---
export async function createClientRequest(params: {
  clientId: string;
  destinationCountry: string;
  destinationCity: string;
  preferredLanguage: string;
  additionalLanguages?: string[];
  travelDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  numberOfTourists: number;
  tourType: string;
  preferredSpecialization?: string;
  approximateBudget: number;
  currency: string;
  meetingLocation: string;
  specialInstructions?: string;
}): Promise<{
  success: boolean;
  request?: ClientRequest;
  eligibleGuides: GuideProfile[];
  invitationsCount: number;
  error?: string;
}> {
  const unlock = await dbMutex.acquire();
  try {
    const client = state.clients.find(c => c.id === params.clientId) || state.clients[0];

    const reqId = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: ClientRequest = {
      id: reqId,
      clientId: client.id,
      clientName: client.fullName,
      clientNationality: client.nationality,
      destinationCountry: params.destinationCountry,
      destinationCity: params.destinationCity,
      preferredLanguage: params.preferredLanguage,
      additionalLanguages: params.additionalLanguages || [],
      travelDate: params.travelDate,
      startTime: params.startTime,
      endTime: params.endTime,
      durationHours: params.durationHours,
      numberOfTourists: params.numberOfTourists,
      tourType: params.tourType,
      preferredSpecialization: params.preferredSpecialization,
      approximateBudget: params.approximateBudget,
      currency: params.currency,
      meetingLocation: params.meetingLocation,
      specialInstructions: params.specialInstructions,
      status: 'OPEN',
      version: 1,
      createdAt: new Date().toISOString()
    };

    state.requests.unshift(newRequest);

    // Run matching engine to identify qualified guides
    const evaluations = findEligibleGuides(state.guides, newRequest, state.bookings);
    const eligibleMatches = evaluations.filter(e => e.isEligible);

    // Create RequestInvitation records and notify all eligible guides
    let invCount = 0;
    eligibleMatches.forEach(match => {
      const inv: RequestInvitation = {
        id: `INV-${reqId}-${match.guide.guideId}`,
        requestId: reqId,
        guideId: match.guide.id,
        guideCode: match.guide.guideId,
        status: 'PENDING',
        invitedAt: new Date().toISOString()
      };
      state.invitations.unshift(inv);
      invCount++;

      // Dispatch notifications to the guide across channels
      const notifTitle = `New Tour Request: ${client.fullName} (${newRequest.destinationCity})`;
      const notifMsg = `${client.fullName} requested a ${newRequest.tourType} tour in ${newRequest.destinationCity} on ${newRequest.travelDate} (${newRequest.startTime} - ${newRequest.endTime}) at ${newRequest.meetingLocation} for ${newRequest.numberOfTourists} pax. Budget: ${newRequest.currency} ${newRequest.approximateBudget}.`;

      const waGuideText = `Hello ${match.guide.fullName}! 🔔 GuideConnect Alert: New tour request ${reqId} matched your profile for ${newRequest.destinationCity} on ${newRequest.travelDate} (${newRequest.startTime}-${newRequest.endTime}) by tourist ${client.fullName}. Open GuideConnect to view and accept.`;

      const gmailSubject = `[GuideConnect] New Tour Request in ${newRequest.destinationCity} from ${client.fullName} [${reqId}]`;
      const gmailBody = `Hello ${match.guide.fullName},\n\nA new client tour request matching your languages and service area has been posted:\n\nRequest ID: ${reqId}\nClient: ${client.fullName} (${client.nationality})\nDestination: ${newRequest.destinationCity}\nDate: ${newRequest.travelDate} (${newRequest.startTime} - ${newRequest.endTime})\nTour Type: ${newRequest.tourType}\nMeeting Location: ${newRequest.meetingLocation}\nApproximate Budget: ${newRequest.currency} ${newRequest.approximateBudget}\nSpecial Notes: ${newRequest.specialInstructions || 'None'}\n\nLog in to your GuideConnect dashboard to accept this reservation (Single-winner atomic transaction).`;

      // 1. In-App Notification
      state.notifications.unshift({
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        recipientId: match.guide.id,
        recipientRole: 'GUIDE',
        recipientName: match.guide.fullName,
        recipientEmail: match.guide.email,
        recipientPhone: match.guide.phone,
        title: notifTitle,
        message: notifMsg,
        channel: 'IN_APP',
        type: 'REQUEST_CREATED',
        referenceId: reqId,
        timestamp: new Date().toISOString(),
        isRead: false,
        details: {
          tourDate: newRequest.travelDate,
          destinationCity: newRequest.destinationCity,
          clientName: client.fullName,
          clientPhone: client.phone,
          clientEmail: client.email,
          meetingLocation: newRequest.meetingLocation,
          currency: newRequest.currency
        }
      });

      // 2. WhatsApp Notification
      state.notifications.unshift({
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        recipientId: match.guide.id,
        recipientRole: 'GUIDE',
        recipientName: match.guide.fullName,
        recipientEmail: match.guide.email,
        recipientPhone: match.guide.phone,
        title: `WhatsApp: ${notifTitle}`,
        message: notifMsg,
        channel: 'WHATSAPP',
        type: 'REQUEST_CREATED',
        referenceId: reqId,
        timestamp: new Date().toISOString(),
        isRead: false,
        externalLink: buildWhatsAppLink(match.guide.phone, waGuideText),
        details: {
          tourDate: newRequest.travelDate,
          destinationCity: newRequest.destinationCity,
          clientName: client.fullName,
          clientPhone: client.phone,
          clientEmail: client.email,
          meetingLocation: newRequest.meetingLocation,
          currency: newRequest.currency
        }
      });

      // 3. Gmail Notification
      state.notifications.unshift({
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        recipientId: match.guide.id,
        recipientRole: 'GUIDE',
        recipientName: match.guide.fullName,
        recipientEmail: match.guide.email,
        recipientPhone: match.guide.phone,
        title: `Gmail: ${gmailSubject}`,
        message: notifMsg,
        channel: 'GMAIL',
        type: 'REQUEST_CREATED',
        referenceId: reqId,
        timestamp: new Date().toISOString(),
        isRead: false,
        externalLink: buildGmailLink(match.guide.email, gmailSubject, gmailBody),
        details: {
          tourDate: newRequest.travelDate,
          destinationCity: newRequest.destinationCity,
          clientName: client.fullName,
          clientPhone: client.phone,
          clientEmail: client.email,
          meetingLocation: newRequest.meetingLocation,
          currency: newRequest.currency
        }
      });
    });

    notify();
    return {
      success: true,
      request: newRequest,
      eligibleGuides: eligibleMatches.map(m => m.guide),
      invitationsCount: invCount
    };
  } finally {
    unlock();
  }
}

// --- ATOMIC SINGLE-WINNER ACCEPTANCE ENGINE ---
// "Treat acceptance as a single-winner transaction:
// If two guides click Accept at almost the same moment, your backend and database
// must ensure that only one booking is created. Simply hiding the request in the interface
// is not sufficient."
export interface AcceptanceNotificationSummary {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  guideName: string;
  guidePhone: string;
  guideCode: string;
  guideUsername: string;
  whatsappUrl: string;
  gmailUrl: string;
  whatsappText: string;
  emailSubject: string;
  emailBody: string;
}

export async function atomicAcceptRequest(
  requestId: string,
  guideId: string
): Promise<{
  success: boolean;
  booking?: Booking;
  error?: string;
  conflictType?: 'ALREADY_ACCEPTED' | 'NOT_ELIGIBLE' | 'OVERLAPPING_SCHEDULE' | 'NOT_FOUND';
  winnerGuideCode?: string;
  dispatchedNotification?: AcceptanceNotificationSummary;
}> {
  const startTime = performance.now();
  // Acquire critical atomic lock
  const unlock = await dbMutex.acquire();

  try {
    // 1. Fetch request with strict transactional check
    const request = state.requests.find(r => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Request not found.', conflictType: 'NOT_FOUND' };
    }

    const guide = state.guides.find(g => g.id === guideId);
    if (!guide) {
      return { success: false, error: 'Guide profile not found.', conflictType: 'NOT_FOUND' };
    }

    // 2. Single-winner check: If already accepted or not open, REJECT immediately!
    if (request.status !== 'OPEN') {
      const elapsed = Math.round(performance.now() - startTime);
      const auditEntry: ConcurrencyAuditLog = {
        id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        requestId: request.id,
        timestamp: new Date().toISOString(),
        attemptedByGuideCode: guide.guideId,
        attemptedByUsername: guide.username,
        result: 'RACE_LOST_ALREADY_ACCEPTED',
        latencyMs: elapsed,
        message: `Atomic race lost: Request was already accepted by ${request.assignedGuideUsername} (${request.assignedGuideId}).`
      };
      state.auditLogs.unshift(auditEntry);
      notify();

      return {
        success: false,
        error: `Request ${requestId} was already claimed by ${request.assignedGuideUsername || 'another guide'}. Acceptance rejected by atomic lock.`,
        conflictType: 'ALREADY_ACCEPTED',
        winnerGuideCode: request.assignedGuideId
      };
    }

    // 3. Re-validate guide availability at moment of acceptance
    const guideBookings = state.bookings.filter(
      b => b.guideId === guide.id &&
           b.travelDate === request.travelDate &&
           b.bookingStatus !== 'CANCELLED'
    );

    const hasConflict = guideBookings.some(b =>
      isTimeOverlapping(request.startTime, request.endTime, b.startTime, b.endTime)
    );

    if (hasConflict) {
      const elapsed = Math.round(performance.now() - startTime);
      state.auditLogs.unshift({
        id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        requestId: request.id,
        timestamp: new Date().toISOString(),
        attemptedByGuideCode: guide.guideId,
        attemptedByUsername: guide.username,
        result: 'AVAILABILITY_CONFLICT',
        latencyMs: elapsed,
        message: 'Rejected: Guide has an overlapping accepted booking at this time interval.'
      });
      notify();

      return {
        success: false,
        error: `You have an overlapping accepted booking on ${request.travelDate} between ${request.startTime} and ${request.endTime}.`,
        conflictType: 'OVERLAPPING_SCHEDULE'
      };
    }

    // 4. ATOMIC STATE TRANSITION
    // Transition request: OPEN -> ACCEPTED, bump version
    request.status = 'ACCEPTED';
    request.assignedGuideId = guide.guideId;
    request.assignedGuideUsername = guide.username;
    request.version += 1;
    request.acceptedAt = new Date().toISOString();

    // 5. Create Booking record
    const bookingId = `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    request.bookingId = bookingId;

    // Calculate indicative pricing range for negotiation baseline
    const estimate = calculateEstimatedPrice(
      request.destinationCity,
      request.durationHours,
      request.numberOfTourists,
      request.tourType,
      state.pricingRules
    );

    const newBooking: Booking = {
      id: bookingId,
      requestId: request.id,
      clientId: request.clientId,
      clientName: request.clientName,
      guideId: guide.id,
      guideCode: guide.guideId,
      guideUsername: guide.username,
      destinationCity: request.destinationCity,
      travelDate: request.travelDate,
      startTime: request.startTime,
      endTime: request.endTime,
      durationHours: request.durationHours,
      numberOfTourists: request.numberOfTourists,
      tourType: request.tourType,
      meetingLocation: request.meetingLocation,
      estimatedPriceMin: estimate.min,
      estimatedPriceMax: estimate.max,
      agreedPrice: null, // Negotiation starts separate from booking!
      currency: request.currency || estimate.currency,
      bookingStatus: 'CONFIRMED',
      negotiationStatus: 'PENDING_OFFER',
      createdAt: new Date().toISOString()
    };
    state.bookings.unshift(newBooking);

    // 6. Update invitations: Winner -> ACCEPTED; All others -> WITHDRAWN
    state.invitations.forEach(inv => {
      if (inv.requestId === request.id) {
        if (inv.guideId === guide.id) {
          inv.status = 'ACCEPTED';
          inv.respondedAt = new Date().toISOString();
        } else if (inv.status === 'PENDING') {
          inv.status = 'WITHDRAWN';
          inv.respondedAt = new Date().toISOString();
        }
      }
    });

    // 7. Dispatch notifications to Client via WhatsApp, Gmail, and In-App
    const client = state.clients.find(c => c.id === request.clientId) || {
      id: request.clientId,
      fullName: request.clientName,
      phone: '+1 416 555 0192',
      email: 'elena.rostova@traveler.com'
    };

    const clientWaMessage = `🎉 Hello ${client.fullName}! Your GuideConnect tour is confirmed!\n\nGuide: ${guide.fullName} (@${guide.username})\nGuide ID: ${guide.guideId}\nMobile No: ${guide.phone}\nDestination: ${request.destinationCity}\nDate: ${request.travelDate} (${request.startTime} - ${request.endTime})\nMeeting Location: ${request.meetingLocation}\nBooking ID: ${bookingId}\n\nFeel free to message or call your guide on WhatsApp!`;

    const clientEmailSubject = `Tour Booking Confirmed: ${request.destinationCity} with Guide ${guide.fullName} [${bookingId}]`;
    const clientEmailBody = `Dear ${client.fullName},\n\nGreat news! Your tour request ${request.id} has been accepted by verified local guide ${guide.fullName}.\n\n--- GUIDE CONTACT & TOUR DETAILS ---\nGuide Name: ${guide.fullName} (@${guide.username})\nSystem Guide ID: ${guide.guideId}\nMobile No: ${guide.phone}\nEmail: ${guide.email}\nExperience: ${guide.yearsOfExperience} Years | ${guide.qualifications.join(', ')}\n\n--- RESERVATION SUMMARY ---\nBooking ID: ${bookingId}\nDestination: ${request.destinationCity}, ${request.destinationCountry}\nDate & Time: ${request.travelDate} (${request.startTime} - ${request.endTime})\nTour Type: ${request.tourType}\nMeeting Location: ${request.meetingLocation}\nEstimated Price: ${estimate.min} - ${estimate.max} ${request.currency}\n\nYou can view ${guide.fullName}'s full profile, portfolio of past tours, or start a chat in your GuideConnect Client Dashboard.\n\nWarm regards,\nGuideConnect Platform`;

    const clientWaUrl = buildWhatsAppLink(client.phone, clientWaMessage);
    const clientGmailUrl = buildGmailLink(client.email, clientEmailSubject, clientEmailBody);

    // In-App Notification for Client
    state.notifications.unshift({
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipientId: client.id,
      recipientRole: 'CLIENT',
      recipientName: client.fullName,
      recipientEmail: client.email,
      recipientPhone: client.phone,
      title: `Tour Confirmed! ${guide.fullName} Accepted Your Booking`,
      message: `Verified guide ${guide.fullName} (@${guide.username}, Mobile: ${guide.phone}) has accepted your tour in ${request.destinationCity} on ${request.travelDate}. Meeting at ${request.meetingLocation}.`,
      channel: 'IN_APP',
      type: 'REQUEST_ACCEPTED',
      referenceId: bookingId,
      timestamp: new Date().toISOString(),
      isRead: false,
      details: {
        tourDate: request.travelDate,
        destinationCity: request.destinationCity,
        guideName: guide.fullName,
        guidePhone: guide.phone,
        guideCode: guide.guideId,
        guideUsername: guide.username,
        clientName: client.fullName,
        clientPhone: client.phone,
        clientEmail: client.email,
        meetingLocation: request.meetingLocation,
        currency: request.currency
      }
    });

    // WhatsApp Notification for Client
    state.notifications.unshift({
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipientId: client.id,
      recipientRole: 'CLIENT',
      recipientName: client.fullName,
      recipientEmail: client.email,
      recipientPhone: client.phone,
      title: `WhatsApp: Tour Confirmed with ${guide.fullName}`,
      message: clientWaMessage,
      channel: 'WHATSAPP',
      type: 'REQUEST_ACCEPTED',
      referenceId: bookingId,
      timestamp: new Date().toISOString(),
      isRead: false,
      externalLink: clientWaUrl,
      details: {
        tourDate: request.travelDate,
        destinationCity: request.destinationCity,
        guideName: guide.fullName,
        guidePhone: guide.phone,
        guideCode: guide.guideId,
        guideUsername: guide.username,
        clientName: client.fullName,
        clientPhone: client.phone,
        clientEmail: client.email,
        meetingLocation: request.meetingLocation,
        currency: request.currency
      }
    });

    // Gmail Notification for Client
    state.notifications.unshift({
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipientId: client.id,
      recipientRole: 'CLIENT',
      recipientName: client.fullName,
      recipientEmail: client.email,
      recipientPhone: client.phone,
      title: `Gmail: ${clientEmailSubject}`,
      message: `Confirmation summary emailed to ${client.email} with guide contact info and meeting location.`,
      channel: 'GMAIL',
      type: 'REQUEST_ACCEPTED',
      referenceId: bookingId,
      timestamp: new Date().toISOString(),
      isRead: false,
      externalLink: clientGmailUrl,
      details: {
        tourDate: request.travelDate,
        destinationCity: request.destinationCity,
        guideName: guide.fullName,
        guidePhone: guide.phone,
        guideCode: guide.guideId,
        guideUsername: guide.username,
        clientName: client.fullName,
        clientPhone: client.phone,
        clientEmail: client.email,
        meetingLocation: request.meetingLocation,
        currency: request.currency
      }
    });

    // Dispatch free real email via FormSubmit in background
    if (client.email && client.email.includes('@')) {
      sendRealWorldEmailViaFreeApi({
        recipientEmail: client.email,
        recipientName: client.fullName,
        subject: clientEmailSubject,
        messageText: clientEmailBody,
        bookingRef: bookingId,
        details: {
          Guide: `${guide.fullName} (${guide.guideId})`,
          GuideMobile: guide.phone,
          Destination: request.destinationCity,
          TourDate: request.travelDate,
          MeetingPoint: request.meetingLocation
        }
      }).catch(err => console.warn('Background email dispatch note', err));
    }

    // 8. Audit log success
    const elapsed = Math.round(performance.now() - startTime);
    state.auditLogs.unshift({
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      requestId: request.id,
      timestamp: new Date().toISOString(),
      attemptedByGuideCode: guide.guideId,
      attemptedByUsername: guide.username,
      result: 'SUCCESS',
      latencyMs: elapsed,
      message: `Successfully reserved booking ${bookingId} in single-winner transaction. Client notified via WhatsApp & Gmail.`
    });

    notify();
    return {
      success: true,
      booking: newBooking,
      dispatchedNotification: {
        clientName: client.fullName,
        clientPhone: client.phone,
        clientEmail: client.email,
        guideName: guide.fullName,
        guidePhone: guide.phone,
        guideCode: guide.guideId,
        guideUsername: guide.username,
        whatsappUrl: clientWaUrl,
        gmailUrl: clientGmailUrl,
        whatsappText: clientWaMessage,
        emailSubject: clientEmailSubject,
        emailBody: clientEmailBody
      }
    };
  } finally {
    unlock();
  }
}

// Decline request invitation (keeps request OPEN for other guides!)
export function declineRequestInvitation(
  requestId: string,
  guideId: string,
  reason?: string
): boolean {
  const inv = state.invitations.find(i => i.requestId === requestId && i.guideId === guideId);
  if (!inv) return false;
  inv.status = 'DECLINED';
  inv.respondedAt = new Date().toISOString();
  inv.declineReason = reason || 'Guide declined availability.';
  notify();
  return true;
}

// Client cancels request
export function cancelClientRequest(requestId: string): boolean {
  const req = state.requests.find(r => r.id === requestId);
  if (!req || req.status === 'CANCELLED') return false;
  req.status = 'CANCELLED';

  // Mark all pending invitations as WITHDRAWN
  state.invitations.forEach(inv => {
    if (inv.requestId === requestId && inv.status === 'PENDING') {
      inv.status = 'WITHDRAWN';
    }
  });

  // If already booked, cancel booking as well
  if (req.bookingId) {
    const booking = state.bookings.find(b => b.id === req.bookingId);
    if (booking) {
      booking.bookingStatus = 'CANCELLED';
    }
  }

  notify();
  return true;
}

// --- CONCURRENCY RACE SIMULATOR ---
// Triggers 2 simultaneous acceptance calls from two distinct guides
export async function simulateConcurrentRace(requestId: string, guideAId: string, guideBId: string) {
  // Fire both simultaneously via Promise.all
  const [resA, resB] = await Promise.all([
    atomicAcceptRequest(requestId, guideAId),
    atomicAcceptRequest(requestId, guideBId)
  ]);

  return { resA, resB };
}

// --- BARGAINING / NEGOTIATION ENGINE ---
// Kept strictly separate from matching & booking!
export function submitNegotiationOffer(params: {
  bookingId: string;
  requestId: string;
  senderRole: 'CLIENT' | 'GUIDE';
  senderId: string;
  senderName: string;
  proposedAmount: number;
  currency: string;
  note?: string;
}): NegotiationOffer {
  const booking = state.bookings.find(b => b.id === params.bookingId);
  if (!booking) throw new Error('Booking not found');

  // Mark previous pending offers as SUPERSEDED
  state.offers.forEach(o => {
    if (o.bookingId === params.bookingId && o.status === 'PENDING') {
      o.status = 'SUPERSEDED';
    }
  });

  const offer: NegotiationOffer = {
    id: `OFFER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingId: params.bookingId,
    requestId: params.requestId,
    senderRole: params.senderRole,
    senderId: params.senderId,
    senderName: params.senderName,
    proposedAmount: params.proposedAmount,
    currency: params.currency,
    note: params.note,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  state.offers.push(offer);
  booking.negotiationStatus = 'PENDING_OFFER';
  notify();
  return offer;
}

export function acceptNegotiationOffer(offerId: string): boolean {
  const offer = state.offers.find(o => o.id === offerId);
  if (!offer || offer.status !== 'PENDING') return false;

  offer.status = 'ACCEPTED';

  // Lock the agreed price onto the booking!
  const booking = state.bookings.find(b => b.id === offer.bookingId);
  if (booking) {
    booking.agreedPrice = offer.proposedAmount;
    booking.negotiationStatus = 'AGREED';
  }

  notify();
  return true;
}

export function rejectNegotiationOffer(offerId: string): boolean {
  const offer = state.offers.find(o => o.id === offerId);
  if (!offer || offer.status !== 'PENDING') return false;
  offer.status = 'REJECTED';
  notify();
  return true;
}

// --- MESSAGING SYSTEM ---
export function sendMessage(params: {
  bookingId: string;
  senderId: string;
  senderRole: 'CLIENT' | 'GUIDE';
  senderName: string;
  content: string;
}): Message {
  const msg: Message = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingId: params.bookingId,
    senderId: params.senderId,
    senderRole: params.senderRole,
    senderName: params.senderName,
    content: params.content,
    timestamp: new Date().toISOString(),
    isRead: false
  };
  state.messages.push(msg);
  notify();
  return msg;
}

// --- BOOKING LIFECYCLE & REVIEWS ---
export function completeBooking(bookingId: string): boolean {
  const booking = state.bookings.find(b => b.id === bookingId);
  if (!booking) return false;
  booking.bookingStatus = 'COMPLETED';
  booking.completedAt = new Date().toISOString();
  notify();
  return true;
}

export function submitReview(params: {
  bookingId: string;
  clientId: string;
  clientName: string;
  clientNationality: string;
  guideId: string;
  rating: number;
  comment: string;
}): Review {
  const booking = state.bookings.find(b => b.id === params.bookingId);
  if (!booking) throw new Error('Booking not found');

  const review: Review = {
    id: `REV-${Date.now()}`,
    bookingId: params.bookingId,
    clientId: params.clientId,
    clientName: params.clientName,
    clientNationality: params.clientNationality,
    guideId: params.guideId,
    rating: params.rating,
    comment: params.comment,
    createdAt: new Date().toISOString()
  };

  state.reviews.push(review);
  booking.reviewSubmitted = true;

  // Recalculate guide rating
  const guide = state.guides.find(g => g.id === params.guideId);
  if (guide) {
    const guideReviews = state.reviews.filter(r => r.guideId === guide.id);
    const avg = guideReviews.reduce((sum, r) => sum + r.rating, 0) / guideReviews.length;
    guide.rating = Math.round(avg * 100) / 100;
    guide.reviewCount = guideReviews.length;
  }

  notify();
  return review;
}

// --- ADMIN CONTROLS ---
export function verifyGuide(guideId: string, isVerified: boolean): boolean {
  const guide = state.guides.find(g => g.id === guideId);
  if (!guide) return false;
  guide.isVerified = isVerified;
  notify();
  return true;
}

export function toggleGuideActive(guideId: string): boolean {
  const guide = state.guides.find(g => g.id === guideId);
  if (!guide) return false;
  guide.isActive = !guide.isActive;
  notify();
  return true;
}

export function updatePricingRule(city: string, updates: Partial<PricingRule>): boolean {
  const rule = state.pricingRules.find(r => r.city.toLowerCase() === city.toLowerCase());
  if (!rule) return false;
  Object.assign(rule, updates);
  notify();
  return true;
}

// --- NOTIFICATION MANAGEMENT ---
export function markNotificationAsRead(notifId: string): boolean {
  const notif = state.notifications.find(n => n.id === notifId);
  if (!notif) return false;
  notif.isRead = true;
  notify();
  return true;
}

export function markAllNotificationsAsRead(recipientId: string): void {
  state.notifications.forEach(n => {
    if (n.recipientId === recipientId) {
      n.isRead = true;
    }
  });
  notify();
}

export function clearUserNotifications(recipientId: string): void {
  state.notifications = state.notifications.filter(n => n.recipientId !== recipientId);
  notify();
}

