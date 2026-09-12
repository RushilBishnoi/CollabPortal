import { describe, it, expect } from 'vitest';

export function calculateStudentCompleteness(profile: {
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  avatarUrl?: string;
  degree?: string;
  department?: string;
  graduationYear?: number;
  institutionId?: string;
  careerInterests?: string[];
  preferredRoles?: string[];
  preferredLocations?: string[];
  projects?: any[];
  certifications?: any[];
}) {
  let basicInfo = 0;
  if (profile.fullName?.trim()) basicInfo += 5;
  if (profile.phoneNumber?.trim()) basicInfo += 5;
  if (profile.bio?.trim()) basicInfo += 5;
  if (profile.avatarUrl?.trim()) basicInfo += 5;

  let education = 0;
  if (profile.degree?.trim()) education += 10;
  if (profile.department?.trim()) education += 10;
  if (profile.graduationYear) education += 5;
  if (profile.institutionId) education += 5;

  let careerPreferences = 0;
  if (profile.careerInterests?.length) careerPreferences += 7;
  if (profile.preferredRoles?.length) careerPreferences += 7;
  if (profile.preferredLocations?.length) careerPreferences += 6;

  let projectsAndCertifications = 0;
  if (profile.projects?.length) projectsAndCertifications += 15;
  if (profile.certifications?.length) projectsAndCertifications += 15;

  return Math.min(100, basicInfo + education + careerPreferences + projectsAndCertifications);
}

describe('Frontend Profile Completeness Calculation Logic', () => {
  it('returns 0 for empty profile object', () => {
    expect(calculateStudentCompleteness({})).toBe(0);
  });

  it('calculates partial score correctly for basic info', () => {
    expect(
      calculateStudentCompleteness({
        fullName: 'Alex Student',
        phoneNumber: '+91 9999999999',
      }),
    ).toBe(10);
  });

  it('calculates full 100% score for complete profile', () => {
    expect(
      calculateStudentCompleteness({
        fullName: 'Alex Student',
        phoneNumber: '+91 9999999999',
        bio: 'Bio details',
        avatarUrl: 'https://example.com/avatar.jpg',
        degree: 'B.Tech',
        department: 'CSE',
        graduationYear: 2026,
        institutionId: 'inst-1',
        careerInterests: ['Web'],
        preferredRoles: ['Fullstack'],
        preferredLocations: ['Remote'],
        projects: [{ id: '1' }],
        certifications: [{ id: '1' }],
      }),
    ).toBe(100);
  });
});
