// ============================================================================
// 🏥 PITCHCONNECT - Medical & Fitness Types v7.5.0
// Path: src/types/medical.ts
// ============================================================================
//
// Comprehensive type definitions for medical records, fitness assessments,
// and return-to-play protocols. Supports GDPR/HIPAA compliance considerations.
//
// ============================================================================

import { Sport, InjurySeverity, InjuryStatus, FitnessStatus, FitnessAssessmentType } from './player';

// ============================================================================
// INJURY TYPES
// ============================================================================

export interface Injury {
  id: string;
  playerId: string;
  
  type: string;
  severity: InjurySeverity;
  location: string;
  
  dateFrom: Date;
  dateTo?: Date | null;
  estimatedReturn?: Date | null;
  actualReturn?: Date | null;
  
  description?: string | null;
  treatment?: string | null;
  therapist?: string | null;
  status: InjuryStatus;
  
  diagnosedBy?: string | null;
  facility?: string | null;
  scans: string[];
  notes?: string | null;
  
  recoveryProgress?: number | null;
  lastAssessment?: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Populated relations
  player?: {
    id: string;
    userId: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
    };
  };
  fitnessAssessments?: FitnessAssessment[];
}

// ============================================================================
// INJURY BODY LOCATIONS
// ============================================================================

export const INJURY_LOCATIONS = [
  // Head & Neck
  { value: 'HEAD', label: 'Head', category: 'Head & Neck' },
  { value: 'NECK', label: 'Neck', category: 'Head & Neck' },
  { value: 'JAW', label: 'Jaw', category: 'Head & Neck' },
  { value: 'FACE', label: 'Face', category: 'Head & Neck' },
  
  // Upper Body
  { value: 'SHOULDER_LEFT', label: 'Left Shoulder', category: 'Upper Body' },
  { value: 'SHOULDER_RIGHT', label: 'Right Shoulder', category: 'Upper Body' },
  { value: 'ARM_LEFT', label: 'Left Arm', category: 'Upper Body' },
  { value: 'ARM_RIGHT', label: 'Right Arm', category: 'Upper Body' },
  { value: 'ELBOW_LEFT', label: 'Left Elbow', category: 'Upper Body' },
  { value: 'ELBOW_RIGHT', label: 'Right Elbow', category: 'Upper Body' },
  { value: 'WRIST_LEFT', label: 'Left Wrist', category: 'Upper Body' },
  { value: 'WRIST_RIGHT', label: 'Right Wrist', category: 'Upper Body' },
  { value: 'HAND_LEFT', label: 'Left Hand', category: 'Upper Body' },
  { value: 'HAND_RIGHT', label: 'Right Hand', category: 'Upper Body' },
  { value: 'FINGER', label: 'Finger', category: 'Upper Body' },
  
  // Torso
  { value: 'CHEST', label: 'Chest', category: 'Torso' },
  { value: 'RIBS_LEFT', label: 'Left Ribs', category: 'Torso' },
  { value: 'RIBS_RIGHT', label: 'Right Ribs', category: 'Torso' },
  { value: 'ABDOMEN', label: 'Abdomen', category: 'Torso' },
  { value: 'BACK_UPPER', label: 'Upper Back', category: 'Torso' },
  { value: 'BACK_LOWER', label: 'Lower Back', category: 'Torso' },
  { value: 'SPINE', label: 'Spine', category: 'Torso' },
  
  // Lower Body
  { value: 'HIP_LEFT', label: 'Left Hip', category: 'Lower Body' },
  { value: 'HIP_RIGHT', label: 'Right Hip', category: 'Lower Body' },
  { value: 'GROIN_LEFT', label: 'Left Groin', category: 'Lower Body' },
  { value: 'GROIN_RIGHT', label: 'Right Groin', category: 'Lower Body' },
  { value: 'THIGH_LEFT', label: 'Left Thigh', category: 'Lower Body' },
  { value: 'THIGH_RIGHT', label: 'Right Thigh', category: 'Lower Body' },
  { value: 'HAMSTRING_LEFT', label: 'Left Hamstring', category: 'Lower Body' },
  { value: 'HAMSTRING_RIGHT', label: 'Right Hamstring', category: 'Lower Body' },
  { value: 'QUADRICEP_LEFT', label: 'Left Quadricep', category: 'Lower Body' },
  { value: 'QUADRICEP_RIGHT', label: 'Right Quadricep', category: 'Lower Body' },
  { value: 'KNEE_LEFT', label: 'Left Knee', category: 'Lower Body' },
  { value: 'KNEE_RIGHT', label: 'Right Knee', category: 'Lower Body' },
  { value: 'CALF_LEFT', label: 'Left Calf', category: 'Lower Body' },
  { value: 'CALF_RIGHT', label: 'Right Calf', category: 'Lower Body' },
  { value: 'ACHILLES_LEFT', label: 'Left Achilles', category: 'Lower Body' },
  { value: 'ACHILLES_RIGHT', label: 'Right Achilles', category: 'Lower Body' },
  { value: 'ANKLE_LEFT', label: 'Left Ankle', category: 'Lower Body' },
  { value: 'ANKLE_RIGHT', label: 'Right Ankle', category: 'Lower Body' },
  { value: 'FOOT_LEFT', label: 'Left Foot', category: 'Lower Body' },
  { value: 'FOOT_RIGHT', label: 'Right Foot', category: 'Lower Body' },
  { value: 'TOE', label: 'Toe', category: 'Lower Body' },
] as const;

export type InjuryLocation = typeof INJURY_LOCATIONS[number]['value'];

// ============================================================================
// INJURY TYPES BY CATEGORY
// ============================================================================

export const INJURY_TYPES = {
  MUSCLE: [
    { value: 'STRAIN', label: 'Muscle Strain' },
    { value: 'TEAR', label: 'Muscle Tear' },
    { value: 'CRAMP', label: 'Muscle Cramp' },
    { value: 'CONTUSION', label: 'Muscle Contusion (Bruise)' },
    { value: 'SPASM', label: 'Muscle Spasm' },
  ],
  LIGAMENT: [
    { value: 'SPRAIN', label: 'Ligament Sprain' },
    { value: 'RUPTURE', label: 'Ligament Rupture' },
    { value: 'ACL_TEAR', label: 'ACL Tear' },
    { value: 'MCL_TEAR', label: 'MCL Tear' },
    { value: 'LCL_TEAR', label: 'LCL Tear' },
    { value: 'PCL_TEAR', label: 'PCL Tear' },
  ],
  BONE: [
    { value: 'FRACTURE', label: 'Fracture' },
    { value: 'STRESS_FRACTURE', label: 'Stress Fracture' },
    { value: 'DISLOCATION', label: 'Dislocation' },
    { value: 'SUBLUXATION', label: 'Subluxation' },
  ],
  TENDON: [
    { value: 'TENDINITIS', label: 'Tendinitis' },
    { value: 'TENDINOPATHY', label: 'Tendinopathy' },
    { value: 'TENDON_TEAR', label: 'Tendon Tear' },
    { value: 'TENDON_RUPTURE', label: 'Tendon Rupture' },
  ],
  HEAD: [
    { value: 'CONCUSSION', label: 'Concussion' },
    { value: 'HEAD_LACERATION', label: 'Head Laceration' },
    { value: 'EYE_INJURY', label: 'Eye Injury' },
    { value: 'DENTAL_INJURY', label: 'Dental Injury' },
  ],
  OTHER: [
    { value: 'LACERATION', label: 'Laceration (Cut)' },
    { value: 'ABRASION', label: 'Abrasion (Graze)' },
    { value: 'BLISTER', label: 'Blister' },
    { value: 'INFLAMMATION', label: 'Inflammation' },
    { value: 'NERVE_INJURY', label: 'Nerve Injury' },
    { value: 'CARTILAGE_DAMAGE', label: 'Cartilage Damage' },
    { value: 'MENISCUS_TEAR', label: 'Meniscus Tear' },
    { value: 'HERNIA', label: 'Hernia' },
    { value: 'ILLNESS', label: 'Illness' },
    { value: 'OTHER', label: 'Other' },
  ],
} as const;

// ============================================================================
// MEDICAL RECORD TYPES
// ============================================================================

export interface MedicalRecord {
  id: string;
  playerId: string;
  
  recordType: MedicalRecordType;
  date: Date;
  
  results?: Record<string, unknown> | null;
  notes?: string | null;
  provider?: string | null;
  facility?: string | null;
  attachments: string[];
  
  isClearanceRecord: boolean;
  clearanceStatus?: string | null;
  clearanceExpiry?: Date | null;
  
  isConfidential: boolean;
  accessRestricted: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Populated relations
  player?: {
    id: string;
    userId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export type MedicalRecordType =
  | 'PHYSICAL_EXAM'
  | 'BLOOD_TEST'
  | 'CARDIAC_SCREENING'
  | 'VISION_TEST'
  | 'DENTAL_EXAM'
  | 'VACCINATION'
  | 'ALLERGY_TEST'
  | 'X_RAY'
  | 'MRI'
  | 'CT_SCAN'
  | 'ULTRASOUND'
  | 'ECG'
  | 'CONCUSSION_BASELINE'
  | 'FITNESS_TEST'
  | 'NUTRITION_ASSESSMENT'
  | 'PSYCHOLOGICAL_ASSESSMENT'
  | 'DRUG_TEST'
  | 'INSURANCE_FORM'
  | 'CLEARANCE'
  | 'OTHER';

export const MEDICAL_RECORD_TYPES: Record<MedicalRecordType, { label: string; icon: string; color: string }> = {
  PHYSICAL_EXAM: { label: 'Physical Examination', icon: '🩺', color: 'blue' },
  BLOOD_TEST: { label: 'Blood Test', icon: '🩸', color: 'red' },
  CARDIAC_SCREENING: { label: 'Cardiac Screening', icon: '❤️', color: 'red' },
  VISION_TEST: { label: 'Vision Test', icon: '👁️', color: 'purple' },
  DENTAL_EXAM: { label: 'Dental Examination', icon: '🦷', color: 'white' },
  VACCINATION: { label: 'Vaccination', icon: '💉', color: 'green' },
  ALLERGY_TEST: { label: 'Allergy Test', icon: '🤧', color: 'orange' },
  X_RAY: { label: 'X-Ray', icon: '🦴', color: 'gray' },
  MRI: { label: 'MRI Scan', icon: '🧲', color: 'blue' },
  CT_SCAN: { label: 'CT Scan', icon: '📡', color: 'blue' },
  ULTRASOUND: { label: 'Ultrasound', icon: '🔊', color: 'cyan' },
  ECG: { label: 'ECG / EKG', icon: '📈', color: 'red' },
  CONCUSSION_BASELINE: { label: 'Concussion Baseline', icon: '🧠', color: 'pink' },
  FITNESS_TEST: { label: 'Fitness Test', icon: '🏃', color: 'green' },
  NUTRITION_ASSESSMENT: { label: 'Nutrition Assessment', icon: '🥗', color: 'green' },
  PSYCHOLOGICAL_ASSESSMENT: { label: 'Psychological Assessment', icon: '🧠', color: 'purple' },
  DRUG_TEST: { label: 'Drug Test', icon: '🧪', color: 'yellow' },
  INSURANCE_FORM: { label: 'Insurance Form', icon: '📋', color: 'blue' },
  CLEARANCE: { label: 'Medical Clearance', icon: '✅', color: 'green' },
  OTHER: { label: 'Other', icon: '📄', color: 'gray' },
};

// ============================================================================
// FITNESS ASSESSMENT
// ============================================================================

export interface FitnessAssessment {
  id: string;
  playerId: string;
  assessorId: string;
  
  type: FitnessAssessmentType;
  date: Date;
  
  // Physical metrics
  weight?: number | null;
  bodyFat?: number | null;
  restingHR?: number | null;
  maxHR?: number | null;
  vo2Max?: number | null;
  
  // Test results
  sprintTime?: number | null;
  agilityTime?: number | null;
  verticalJump?: number | null;
  beepTestLevel?: number | null;
  
  // Flexibility & mobility
  flexibilityScore?: number | null;
  mobilityNotes?: string | null;
  
  // Strength tests
  strengthTests?: Record<string, number> | null;
  
  // Overall assessment
  overallScore?: number | null;
  status: FitnessStatus;
  
  // Return to Play
  isRTPAssessment: boolean;
  injuryId?: string | null;
  rtpStage?: number | null;
  rtpCleared: boolean;
  rtpClearedDate?: Date | null;
  
  notes?: string | null;
  recommendations: string[];
  attachments: string[];
  nextAssessmentDue?: Date | null;
  
  // Sport-specific
  sportSpecificMetrics?: Record<string, unknown> | null;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Populated relations
  player?: {
    id: string;
    userId: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
    };
  };
  assessor?: {
    firstName: string;
    lastName: string;
  };
  injury?: Injury | null;
}

// ============================================================================
// FITNESS ASSESSMENT TYPE CONFIG
// ============================================================================

export const FITNESS_ASSESSMENT_TYPE_CONFIG: Record<FitnessAssessmentType, { label: string; icon: string; description: string }> = {
  PRE_SEASON: {
    label: 'Pre-Season',
    icon: '🏋️',
    description: 'Baseline fitness assessment before season starts',
  },
  MID_SEASON: {
    label: 'Mid-Season',
    icon: '📊',
    description: 'Mid-season fitness check',
  },
  POST_SEASON: {
    label: 'Post-Season',
    icon: '📉',
    description: 'End of season assessment',
  },
  RETURN_TO_PLAY: {
    label: 'Return to Play',
    icon: '🔄',
    description: 'Assessment during return to play protocol',
  },
  INJURY_FOLLOW_UP: {
    label: 'Injury Follow-up',
    icon: '🏥',
    description: 'Follow-up assessment after injury',
  },
  ROUTINE: {
    label: 'Routine',
    icon: '📋',
    description: 'Regular fitness monitoring',
  },
  TRANSFER_MEDICAL: {
    label: 'Transfer Medical',
    icon: '↔️',
    description: 'Medical assessment for transfer',
  },
  INITIAL_REGISTRATION: {
    label: 'Initial Registration',
    icon: '📝',
    description: 'First assessment on joining',
  },
};

// ============================================================================
// RETURN TO PLAY PROTOCOL
// ============================================================================

export interface RTPStage {
  stage: number;
  name: string;
  description: string;
  duration: string;
  activities: string[];
  criteria: string[];
  clearanceRequired: boolean;
}

export const RTP_PROTOCOL: RTPStage[] = [
  {
    stage: 1,
    name: 'Symptom-Limited Activity',
    description: 'Light activities of daily living that do not provoke symptoms',
    duration: '24-48 hours minimum',
    activities: [
      'Walking at comfortable pace',
      'Light stretching',
      'Normal daily activities',
    ],
    criteria: [
      'No symptoms at rest',
      'No symptoms during light activity',
    ],
    clearanceRequired: false,
  },
  {
    stage: 2,
    name: 'Light Aerobic Exercise',
    description: 'Increase heart rate with light aerobic activity',
    duration: '24-48 hours minimum',
    activities: [
      'Stationary cycling',
      'Light jogging',
      'Swimming',
      '10-15 minutes at 70% max HR',
    ],
    criteria: [
      'No symptoms during or after exercise',
      'Maintain 70% max heart rate',
    ],
    clearanceRequired: false,
  },
  {
    stage: 3,
    name: 'Sport-Specific Exercise',
    description: 'Add movement and sport-specific activities',
    duration: '24-48 hours minimum',
    activities: [
      'Running drills',
      'Passing drills (no heading in football)',
      'Position-specific movements',
      'No contact activities',
    ],
    criteria: [
      'No symptoms during complex movements',
      'Normal coordination and balance',
    ],
    clearanceRequired: true,
  },
  {
    stage: 4,
    name: 'Non-Contact Training',
    description: 'Participation in training without contact',
    duration: '24-48 hours minimum',
    activities: [
      'Full training drills',
      'Resistance training',
      'Increased intensity',
      'No contact or collision',
    ],
    criteria: [
      'No symptoms at full exertion',
      'Normal cognitive function',
      'Normal reaction time',
    ],
    clearanceRequired: true,
  },
  {
    stage: 5,
    name: 'Full Contact Practice',
    description: 'Return to full contact practice after medical clearance',
    duration: 'Medical clearance required',
    activities: [
      'Full contact training',
      'Match simulation',
      'All activities permitted',
    ],
    criteria: [
      'Medical clearance obtained',
      'No symptoms for 24+ hours',
      'Normal on all assessments',
    ],
    clearanceRequired: true,
  },
  {
    stage: 6,
    name: 'Return to Competition',
    description: 'Full return to competitive matches',
    duration: 'As cleared',
    activities: [
      'Full match participation',
      'All competitive activities',
    ],
    criteria: [
      'Completed all previous stages',
      'Final medical clearance',
      'Coach approval',
    ],
    clearanceRequired: true,
  },
];

// ============================================================================
// SQUAD AVAILABILITY
// ============================================================================

export interface SquadAvailability {
  total: number;
  fit: number;
  injured: number;
  ill: number;
  suspended: number;
  international: number;
  doubtful: number;
  unavailable: number;
}

export interface PlayerAvailabilityDetails {
  playerId: string;
  playerName: string;
  avatar?: string;
  position?: string;
  status: 'FIT' | 'DOUBTFUL' | 'UNAVAILABLE';
  reason?: string;
  expectedReturn?: Date | null;
  injuryDetails?: {
    type: string;
    location: string;
    severity: InjurySeverity;
  } | null;
}

// ============================================================================
// MEDICAL ACCESS PERMISSIONS
// ============================================================================

export type MedicalAccessLevel = 
  | 'FULL'           // Medical staff - full access
  | 'AVAILABILITY'   // Coaches - availability status only
  | 'OWN'            // Players - own records
  | 'CHILD'          // Parents - children's records
  | 'NONE';          // No access

export interface MedicalAccessConfig {
  canViewFullRecords: boolean;
  canViewInjuryDetails: boolean;
  canViewAvailabilityOnly: boolean;
  canCreateRecords: boolean;
  canEditRecords: boolean;
  canDeleteRecords: boolean;
  canViewConfidential: boolean;
}

export const MEDICAL_ACCESS_BY_ROLE: Record<string, MedicalAccessConfig> = {
  MEDICAL_STAFF: {
    canViewFullRecords: true,
    canViewInjuryDetails: true,
    canViewAvailabilityOnly: true,
    canCreateRecords: true,
    canEditRecords: true,
    canDeleteRecords: false,
    canViewConfidential: true,
  },
  PHYSIOTHERAPIST: {
    canViewFullRecords: true,
    canViewInjuryDetails: true,
    canViewAvailabilityOnly: true,
    canCreateRecords: true,
    canEditRecords: true,
    canDeleteRecords: false,
    canViewConfidential: false,
  },
  HEAD_COACH: {
    canViewFullRecords: false,
    canViewInjuryDetails: false,
    canViewAvailabilityOnly: true,
    canCreateRecords: false,
    canEditRecords: false,
    canDeleteRecords: false,
    canViewConfidential: false,
  },
  MANAGER: {
    canViewFullRecords: false,
    canViewInjuryDetails: false,
    canViewAvailabilityOnly: true,
    canCreateRecords: false,
    canEditRecords: false,
    canDeleteRecords: false,
    canViewConfidential: false,
  },
  PARENT: {
    canViewFullRecords: true, // For their children only
    canViewInjuryDetails: true, // For their children only
    canViewAvailabilityOnly: true,
    canCreateRecords: false,
    canEditRecords: false,
    canDeleteRecords: false,
    canViewConfidential: false,
  },
  PLAYER: {
    canViewFullRecords: true, // Own records only
    canViewInjuryDetails: true, // Own records only
    canViewAvailabilityOnly: true,
    canCreateRecords: false,
    canEditRecords: false,
    canDeleteRecords: false,
    canViewConfidential: false,
  },
};

// ============================================================================
// CONCUSSION PROTOCOLS BY SPORT
// ============================================================================

export interface ConcussionProtocol {
  sport: Sport;
  minimumRestDays: number;
  stagesRequired: number[];
  additionalRequirements: string[];
  governingBody: string;
  guidelinesUrl?: string;
}

export const CONCUSSION_PROTOCOLS: Partial<Record<Sport, ConcussionProtocol>> = {
  FOOTBALL: {
    sport: 'FOOTBALL',
    minimumRestDays: 6,
    stagesRequired: [1, 2, 3, 4, 5, 6],
    additionalRequirements: [
      'Heading restrictions may apply for 2 weeks post-clearance',
      'Gradual return to heading activities',
    ],
    governingBody: 'FIFA/FA',
    guidelinesUrl: 'https://www.thefa.com/football-rules-governance/safeguarding/concussion-guidelines',
  },
  RUGBY: {
    sport: 'RUGBY',
    minimumRestDays: 12,
    stagesRequired: [1, 2, 3, 4, 5, 6],
    additionalRequirements: [
      'Head Injury Assessment (HIA) protocol',
      'Mandatory 12-day minimum return period',
      'Extended protocol for repeat concussions',
    ],
    governingBody: 'World Rugby',
    guidelinesUrl: 'https://www.world.rugby/the-game/player-welfare/medical/concussion',
  },
  AMERICAN_FOOTBALL: {
    sport: 'AMERICAN_FOOTBALL',
    minimumRestDays: 7,
    stagesRequired: [1, 2, 3, 4, 5, 6],
    additionalRequirements: [
      'Independent neurological consultant required',
      'Post-concussion symptom scale',
      'Cognitive testing (ImPACT)',
    ],
    governingBody: 'NFL/NFLPA',
  },
  HOCKEY: {
    sport: 'HOCKEY',
    minimumRestDays: 7,
    stagesRequired: [1, 2, 3, 4, 5, 6],
    additionalRequirements: [
      'Quiet room evaluation',
      'Independent concussion spotters',
    ],
    governingBody: 'NHL/NHLPA',
  },
  BASKETBALL: {
    sport: 'BASKETBALL',
    minimumRestDays: 5,
    stagesRequired: [1, 2, 3, 4, 5, 6],
    additionalRequirements: [
      'Baseline cognitive testing',
    ],
    governingBody: 'NBA/WNBA',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get injury severity color
 */
export function getInjurySeverityColor(severity: InjurySeverity): string {
  const colors: Record<InjurySeverity, string> = {
    MINOR: 'yellow',
    MODERATE: 'orange',
    SEVERE: 'red',
    CRITICAL: 'red',
    CAREER_THREATENING: 'purple',
  };
  return colors[severity];
}

/**
 * Get fitness status color
 */
export function getFitnessStatusColor(status: FitnessStatus): string {
  const colors: Record<FitnessStatus, string> = {
    FIT: 'green',
    FIT_WITH_CAUTION: 'yellow',
    LIMITED: 'orange',
    NOT_FIT: 'red',
    PENDING_REVIEW: 'blue',
    CLEARED: 'green',
  };
  return colors[status];
}

/**
 * Calculate days since injury
 */
export function getDaysSinceInjury(dateFrom: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(dateFrom).getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate estimated days to return
 */
export function getDaysToReturn(estimatedReturn: Date | null | undefined): number | null {
  if (!estimatedReturn) return null;
  const now = new Date();
  const returnDate = new Date(estimatedReturn);
  const diffTime = returnDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get RTP stage info
 */
export function getRTPStage(stage: number): RTPStage | null {
  return RTP_PROTOCOL.find(s => s.stage === stage) || null;
}

/**
 * Calculate RTP progress percentage
 */
export function getRTPProgress(currentStage: number): number {
  return Math.round((currentStage / 6) * 100);
}

/**
 * Check if user can access medical records
 */
export function canAccessMedicalRecords(
  userRole: string,
  playerId: string,
  userId: string,
  parentChildIds: string[] = []
): MedicalAccessConfig {
  const config = MEDICAL_ACCESS_BY_ROLE[userRole];
  
  if (!config) {
    return {
      canViewFullRecords: false,
      canViewInjuryDetails: false,
      canViewAvailabilityOnly: false,
      canCreateRecords: false,
      canEditRecords: false,
      canDeleteRecords: false,
      canViewConfidential: false,
    };
  }
  
  // For PLAYER role, check if viewing own records
  if (userRole === 'PLAYER') {
    const isOwnRecord = playerId === userId;
    return {
      ...config,
      canViewFullRecords: isOwnRecord,
      canViewInjuryDetails: isOwnRecord,
    };
  }
  
  // For PARENT role, check if viewing child's records
  if (userRole === 'PARENT') {
    const isChildRecord = parentChildIds.includes(playerId);
    return {
      ...config,
      canViewFullRecords: isChildRecord,
      canViewInjuryDetails: isChildRecord,
    };
  }
  
  return config;
}
