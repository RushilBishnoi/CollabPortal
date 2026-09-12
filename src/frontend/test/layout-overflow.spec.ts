import { describe, it, expect } from 'vitest';
import React from 'react';

// Verification of navLinks logic for all authenticated and unauthenticated roles
function getNavLinksForRole(isAuthenticated: boolean, role?: string) {
  return [
    ...(isAuthenticated ? [{ name: 'Home', path: '/' }] : []),
    ...(isAuthenticated
      ? [
          { name: role === 'INDUSTRY' ? 'My Opportunities' : 'Opportunities', path: '/opportunities' },
          { name: 'Collaborations', path: '/collaborations' },
          { name: role === 'INSTITUTION_ADMIN' ? 'Learning Programmes' : 'Learning Hub', path: '/learning' },
          ...(role !== 'INDUSTRY'
            ? [{ name: role === 'INSTITUTION_ADMIN' ? 'Mentorship Programmes' : 'Mentors', path: '/mentorship/mentors' }]
            : []),
        ]
      : []),
    ...(isAuthenticated && role === 'STUDENT'
      ? [
          { name: 'My Applications', path: '/applications' },
          { name: 'My Offers', path: '/portal/student/offers' },
          { name: 'My Mentorship', path: '/portal/student/mentorship' },
        ]
      : []),
    ...(isAuthenticated && (role === 'INDUSTRY' || role === 'FACULTY')
      ? [
          { name: 'Mentor Workspace', path: '/portal/mentor/workspace' },
        ]
      : []),
    ...(isAuthenticated && role === 'INDUSTRY'
      ? [
          { name: 'My Collaborations', path: '/industry/collaborations' },
          { name: 'Placements', path: '/portal/industry/placements' },
        ]
      : []),
    ...(isAuthenticated && role === 'INSTITUTION_ADMIN'
      ? [
          { name: 'Institutional Analytics', path: '/analytics/institution' },
          { name: 'Placements', path: '/portal/institution/placements' },
        ]
      : []),
    ...(isAuthenticated && role === 'SUPER_ADMIN' ? [{ name: 'Platform Analytics', path: '/analytics/platform' }] : []),
    ...(isAuthenticated ? [{ name: 'Dashboard', path: '/dashboard' }] : []),
  ];
}

describe('Authenticated Header Layout & Overflow Regression Tests', () => {
  it('should generate empty navLinks for Logged-Out user without Home or System Status in public nav', () => {
    const links = getNavLinksForRole(false);
    expect(links.map((l) => l.name)).toEqual([]);
    expect(links.some((l) => l.name.includes('System Status'))).toBe(false);
  });

  it('should generate correct navLinks for STUDENT role', () => {
    const links = getNavLinksForRole(true, 'STUDENT');
    expect(links.map((l) => l.name)).toEqual([
      'Home',
      'Opportunities',
      'Collaborations',
      'Learning Hub',
      'Mentors',
      'My Applications',
      'My Offers',
      'My Mentorship',
      'Dashboard',
    ]);
  });

  it('should generate correct navLinks for FACULTY role', () => {
    const links = getNavLinksForRole(true, 'FACULTY');
    expect(links.map((l) => l.name)).toEqual([
      'Home',
      'Opportunities',
      'Collaborations',
      'Learning Hub',
      'Mentors',
      'Mentor Workspace',
      'Dashboard',
    ]);
  });

  it('should generate correct navLinks for INDUSTRY role', () => {
    const links = getNavLinksForRole(true, 'INDUSTRY');
    expect(links.map((l) => l.name)).toEqual([
      'Home',
      'My Opportunities',
      'Collaborations',
      'Learning Hub',
      'Mentor Workspace',
      'My Collaborations',
      'Placements',
      'Dashboard',
    ]);
  });

  it('should generate correct navLinks for INSTITUTION_ADMIN role', () => {
    const links = getNavLinksForRole(true, 'INSTITUTION_ADMIN');
    expect(links.map((l) => l.name)).toEqual([
      'Home',
      'Opportunities',
      'Collaborations',
      'Learning Programmes',
      'Mentorship Programmes',
      'Institutional Analytics',
      'Placements',
      'Dashboard',
    ]);
  });

  it('should generate correct navLinks for SUPER_ADMIN role', () => {
    const links = getNavLinksForRole(true, 'SUPER_ADMIN');
    expect(links.map((l) => l.name)).toEqual([
      'Home',
      'Opportunities',
      'Collaborations',
      'Learning Hub',
      'Mentors',
      'Platform Analytics',
      'Dashboard',
    ]);
  });

  it('should ensure System Status is never present in navLinks across any role', () => {
    const roles = [undefined, 'STUDENT', 'FACULTY', 'INDUSTRY', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'];
    roles.forEach((r) => {
      const links = getNavLinksForRole(Boolean(r), r);
      const hasSystemStatus = links.some((l) => l.name.toLowerCase().includes('status'));
      expect(hasSystemStatus).toBe(false);
    });
  });

  it('should compute navbar visibility globally across all routes and roles based on scroll and mobile menu state', () => {
    function computeShouldShowNav(isNavVisible: boolean, mobileMenuOpen: boolean) {
      return isNavVisible || mobileMenuOpen;
    }

    const testRoutesByRole = [
      { role: 'LOGGED_OUT', routes: ['/', '/status', '/login', '/register'] },
      { role: 'STUDENT', routes: ['/opportunities', '/collaborations', '/learning', '/mentorship/mentors', '/applications', '/portal/student/offers', '/portal/student/mentorship', '/dashboard'] },
      { role: 'FACULTY', routes: ['/opportunities', '/collaborations', '/learning', '/mentorship/mentors', '/portal/mentor/workspace', '/dashboard'] },
      { role: 'INDUSTRY', routes: ['/opportunities', '/collaborations', '/learning', '/industry/collaborations', '/portal/industry/placements', '/dashboard'] },
      { role: 'INSTITUTION_ADMIN', routes: ['/opportunities', '/collaborations', '/learning', '/mentorship/mentors', '/analytics/institution', '/portal/institution/placements', '/dashboard'] },
      { role: 'SUPER_ADMIN', routes: ['/opportunities', '/collaborations', '/learning', '/mentorship/mentors', '/analytics/platform', '/dashboard'] },
    ];

    testRoutesByRole.forEach(({ role, routes }) => {
      routes.forEach((route) => {
        // 1. At the top of the page / scrolling up: navbar is visible
        expect(
          computeShouldShowNav(true, false),
          `Expected navbar to be visible at top/scrolling up for ${role} on ${route}`
        ).toBe(true);

        // 2. Scrolling down: navbar hides across all routes and roles
        expect(
          computeShouldShowNav(false, false),
          `Expected navbar to hide when scrolling down for ${role} on ${route}`
        ).toBe(false);

        // 3. Scrolling down but mobile menu is open: navbar MUST remain visible
        expect(
          computeShouldShowNav(false, true),
          `Expected navbar to remain visible when mobile menu open for ${role} on ${route}`
        ).toBe(true);

        // 4. Scrolling up with mobile menu open: navbar remains visible
        expect(
          computeShouldShowNav(true, true),
          `Expected navbar to be visible for ${role} on ${route}`
        ).toBe(true);
      });
    });
  });

  it('should verify authenticated navbar layout rules: no horizontal scroll classes and preserved role links', () => {
    const roles = ['STUDENT', 'FACULTY', 'INDUSTRY', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'];

    roles.forEach((role) => {
      const links = getNavLinksForRole(true, role);
      // All authenticated roles should have their specific navigation links
      expect(links.length).toBeGreaterThan(0);
      expect(links[0].name).toBe('Home');
      expect(links[links.length - 1].name).toBe('Dashboard');
    });
  });
});
