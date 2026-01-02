// ============================================================================
// 🏥 MEDICAL TYPES - PitchConnect v7.5.0
// ============================================================================

import type { Sport } from './player';
import type { UserRole } from './next-auth.d';

export type InjuryLocation = 'HEAD' | 'NECK' | 'SHOULDER_LEFT' | 'SHOULDER_RIGHT' | 'KNEE_LEFT' | 'KNEE_RIGHT' | 'ANKLE_LEFT' | 'ANKLE_RIGHT' | 'HAMSTRING_LEFT' | 'HAMSTRING_RIGHT' | 'GROIN_LEFT' | 'GROIN_RIGHT' | 'CALF_LEFT' | 'CALF_RIGHT' | 'BACK' | 'OTHER';
export type InjuryType = 'STRAIN' | 'TEAR' | 'SPRAIN' | 'FRACTURE' | 'CONCUSSION' | 'CONTUSION' | 'DISLOCATION' | 'TENDINITIS' | 'OTHER';
export type InjurySeverity = 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL' | 'CAREER_THREATENING';
export type InjuryStatus = 'ACTIVE' | 'RECOVERING' | 'REHABILITATION' | 'CLEARED' | 'CHRONIC';
export type RTPStage = 'STAGE_1_REST' | 'STAGE_2_LIGHT_ACTIVITY' | 'STAGE_3_SPORT_SPECIFIC' | 'STAGE_4_NON_CONTACT' | 'STAGE_5_FULL_CONTACT' | 'STAGE_6_CLEARED';
export type MedicalRecordType = 'INJURY_REPORT' | 'TREATMENT_NOTE' | 'CLEARANCE_FORM' | 'FITNESS_ASSESSMENT' | 'CONCUSSION_ASSESSMENT' | 'OTHER';

export const INJURY_LOCATIONS: InjuryLocation[] = ['HEAD', 'NECK', 'SHOULDER_LEFT', 'SHOULDER_RIGHT', 'KNEE_LEFT', 'KNEE_RIGHT', 'ANKLE_LEFT', 'ANKLE_RIGHT', 'HAMSTRING_LEFT', 'HAMSTRING_RIGHT', 'GROIN_LEFT', 'GROIN_RIGHT', 'CALF_LEFT', 'CALF_RIGHT', 'BACK', 'OTHER'];
export const INJURY_TYPES: Record<string, InjuryType[]> = { MUSCLE: ['STRAIN', 'TEAR', 'CONTUSION'], LIGAMENT: ['SPRAIN', 'TEAR'], BONE: ['FRACTURE', 'DISLOCATION'], HEAD: ['CONCUSSION'], OTHER: ['TENDINITIS', 'OTHER'] };
export const MEDICAL_RECORD_TYPES: MedicalRecordType[] = ['INJURY_REPORT', 'TREATMENT_NOTE', 'CLEARANCE_FORM', 'FITNESS_ASSESSMENT', 'CONCUSSION_ASSESSMENT', 'OTHER'];

export interface Injury { id: string; playerId: string; type: InjuryType; location: InjuryLocation; severity: InjurySeverity; status: InjuryStatus; description: string; injuryDate: Date; expectedReturnDate: Date | null; actualReturnDate: Date | null; rtpStage: RTPStage | null; rtpProgress: number; createdAt: Date; updatedAt: Date; }
export interface MedicalRecord { id: string; playerId: string; type: MedicalRecordType; title: string; content: Record<string, unknown>; isConfidential: boolean; createdAt: Date; }
export interface FitnessAssessment { id: string; playerId: string; assessmentDate: Date; metrics: FitnessMetrics; fitnessLevel: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR'; cleared: boolean; }
export interface FitnessMetrics { vo2Max?: number; sprintTime10m?: number; verticalJump?: number; beepTestLevel?: number; weight?: number; bodyFatPercentage?: number; }
export interface ConcussionProtocol { sport: Sport; governingBody: string; protocolName: string; minRestDays: number; stages: number; additionalRequirements: string[]; specialConsiderations: string[]; }
export interface MedicalAccessConfig { canViewInjuries: boolean; canViewFullMedical: boolean; canEditMedical: boolean; canViewOwnOnly: boolean; canViewChildOnly: boolean; }

export const RTP_PROTOCOL = [
  { stage: 'STAGE_1_REST' as RTPStage, name: 'Complete Rest', minDuration: 1 },
  { stage: 'STAGE_2_LIGHT_ACTIVITY' as RTPStage, name: 'Light Activity', minDuration: 1 },
  { stage: 'STAGE_3_SPORT_SPECIFIC' as RTPStage, name: 'Sport-Specific', minDuration: 1 },
  { stage: 'STAGE_4_NON_CONTACT' as RTPStage, name: 'Non-Contact', minDuration: 1 },
  { stage: 'STAGE_5_FULL_CONTACT' as RTPStage, name: 'Full Contact', minDuration: 1 },
  { stage: 'STAGE_6_CLEARED' as RTPStage, name: 'Cleared', minDuration: 0 },
];

export const CONCUSSION_PROTOCOLS: Record<Sport, ConcussionProtocol> = {
  FOOTBALL: { sport: 'FOOTBALL', governingBody: 'FIFA/FA', protocolName: 'FIFA Concussion Protocol', minRestDays: 6, stages: 6, additionalRequirements: ['Team physician clearance'], specialConsiderations: ['No heading until Stage 5'] },
  RUGBY: { sport: 'RUGBY', governingBody: 'World Rugby', protocolName: 'HIA Protocol', minRestDays: 12, stages: 6, additionalRequirements: ['HIA assessments'], specialConsiderations: ['Extended for repeat concussions'] },
  AMERICAN_FOOTBALL: { sport: 'AMERICAN_FOOTBALL', governingBody: 'NFL/NCAA', protocolName: 'NFL Protocol', minRestDays: 5, stages: 5, additionalRequirements: ['Independent neurologist'], specialConsiderations: ['Baseline ImPACT testing'] },
  BASKETBALL: { sport: 'BASKETBALL', governingBody: 'FIBA/NBA', protocolName: 'NBA Policy', minRestDays: 5, stages: 5, additionalRequirements: ['Physician clearance'], specialConsiderations: [] },
  HOCKEY: { sport: 'HOCKEY', governingBody: 'IIHF/NHL', protocolName: 'NHL Protocol', minRestDays: 7, stages: 6, additionalRequirements: ['SCAT5 testing'], specialConsiderations: ['League spotters'] },
  CRICKET: { sport: 'CRICKET', governingBody: 'ICC', protocolName: 'ICC Guidelines', minRestDays: 7, stages: 6, additionalRequirements: ['Concussion substitute rule'], specialConsiderations: ['Position-specific protocols'] },
  NETBALL: { sport: 'NETBALL', governingBody: 'INF', protocolName: 'Netball Guidelines', minRestDays: 6, stages: 6, additionalRequirements: ['Medical clearance'], specialConsiderations: [] },
  LACROSSE: { sport: 'LACROSSE', governingBody: 'World Lacrosse', protocolName: 'Lacrosse Protocol', minRestDays: 6, stages: 6, additionalRequirements: ['Physician clearance'], specialConsiderations: ['Men/women rules differ'] },
  AUSTRALIAN_RULES: { sport: 'AUSTRALIAN_RULES', governingBody: 'AFL', protocolName: 'AFL Guidelines', minRestDays: 12, stages: 6, additionalRequirements: ['12-day stand-down'], specialConsiderations: ['Independent spotters'] },
  GAELIC_FOOTBALL: { sport: 'GAELIC_FOOTBALL', governingBody: 'GAA', protocolName: 'GAA Management', minRestDays: 7, stages: 6, additionalRequirements: ['Doctor assessment'], specialConsiderations: ['No same-day return'] },
  FUTSAL: { sport: 'FUTSAL', governingBody: 'FIFA', protocolName: 'FIFA Futsal Protocol', minRestDays: 6, stages: 6, additionalRequirements: ['Same as football'], specialConsiderations: ['Indoor surface'] },
  BEACH_FOOTBALL: { sport: 'BEACH_FOOTBALL', governingBody: 'FIFA', protocolName: 'Beach Soccer Protocol', minRestDays: 6, stages: 6, additionalRequirements: ['Same as football'], specialConsiderations: ['Sand surface safer'] },
};

export const MEDICAL_ACCESS_BY_ROLE: Record<UserRole, MedicalAccessConfig> = {
  SUPERADMIN: { canViewInjuries: true, canViewFullMedical: true, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  ADMIN: { canViewInjuries: true, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  LEAGUE_ADMIN: { canViewInjuries: true, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  CLUB_OWNER: { canViewInjuries: true, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  MANAGER: { canViewInjuries: true, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  TREASURER: { canViewInjuries: false, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  COACH: { canViewInjuries: true, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  ASSISTANT_COACH: { canViewInjuries: true, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  MEDICAL_STAFF: { canViewInjuries: true, canViewFullMedical: true, canEditMedical: true, canViewOwnOnly: false, canViewChildOnly: false },
  PHYSIO: { canViewInjuries: true, canViewFullMedical: true, canEditMedical: true, canViewOwnOnly: false, canViewChildOnly: false },
  ANALYST: { canViewInjuries: true, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  SCOUT: { canViewInjuries: false, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  REFEREE: { canViewInjuries: false, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  PLAYER_PRO: { canViewInjuries: true, canViewFullMedical: true, canEditMedical: false, canViewOwnOnly: true, canViewChildOnly: false },
  PLAYER: { canViewInjuries: true, canViewFullMedical: true, canEditMedical: false, canViewOwnOnly: true, canViewChildOnly: false },
  PARENT: { canViewInjuries: true, canViewFullMedical: true, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: true },
  GUARDIAN: { canViewInjuries: true, canViewFullMedical: true, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: true },
  VIEWER: { canViewInjuries: false, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
  USER: { canViewInjuries: false, canViewFullMedical: false, canEditMedical: false, canViewOwnOnly: false, canViewChildOnly: false },
};

export function getInjurySeverityColor(severity: InjurySeverity): string {
  const colors: Record<InjurySeverity, string> = { MINOR: 'text-yellow-700 bg-yellow-100', MODERATE: 'text-orange-700 bg-orange-100', SEVERE: 'text-red-700 bg-red-100', CRITICAL: 'text-red-800 bg-red-200', CAREER_THREATENING: 'text-purple-700 bg-purple-100' };
  return colors[severity];
}

export function getFitnessStatusColor(level: FitnessAssessment['fitnessLevel']): string {
  const colors: Record<FitnessAssessment['fitnessLevel'], string> = { EXCELLENT: 'text-green-700 bg-green-100', GOOD: 'text-blue-700 bg-blue-100', AVERAGE: 'text-yellow-700 bg-yellow-100', BELOW_AVERAGE: 'text-orange-700 bg-orange-100', POOR: 'text-red-700 bg-red-100' };
  return colors[level];
}

export function getDaysSinceInjury(injuryDate: Date): number { return Math.floor((Date.now() - new Date(injuryDate).getTime()) / (1000 * 60 * 60 * 24)); }
export function getDaysToReturn(expectedReturnDate: Date | null): number | null { if (!expectedReturnDate) return null; return Math.max(0, Math.ceil((new Date(expectedReturnDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))); }
export function getRTPStage(stageNumber: number): RTPStage { const stages: RTPStage[] = ['STAGE_1_REST', 'STAGE_2_LIGHT_ACTIVITY', 'STAGE_3_SPORT_SPECIFIC', 'STAGE_4_NON_CONTACT', 'STAGE_5_FULL_CONTACT', 'STAGE_6_CLEARED']; return stages[Math.min(stageNumber - 1, 5)] || 'STAGE_1_REST'; }
export function getRTPProgress(stage: RTPStage): number { const progress: Record<RTPStage, number> = { STAGE_1_REST: 0, STAGE_2_LIGHT_ACTIVITY: 20, STAGE_3_SPORT_SPECIFIC: 40, STAGE_4_NON_CONTACT: 60, STAGE_5_FULL_CONTACT: 80, STAGE_6_CLEARED: 100 }; return progress[stage]; }
export function canAccessMedicalRecords(role: UserRole, playerId: string, userId: string, childIds: string[] = []): boolean { const access = MEDICAL_ACCESS_BY_ROLE[role]; if (!access) return false; if (access.canViewFullMedical && !access.canViewOwnOnly && !access.canViewChildOnly) return true; if (access.canViewOwnOnly && playerId === userId) return true; if (access.canViewChildOnly && childIds.includes(playerId)) return true; return false; }
export function getConcussionProtocol(sport: Sport): ConcussionProtocol { return CONCUSSION_PROTOCOLS[sport]; }
export function getMinConcussionRestDays(sport: Sport): number { return CONCUSSION_PROTOCOLS[sport]?.minRestDays || 7; }