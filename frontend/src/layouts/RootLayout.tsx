import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export const RootLayout: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);

  // Close mobile menu and restore navbar visibility when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setIsNavVisible(true);
  }, [location.pathname]);

  // Navbar hide/reveal on scroll across all pages
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Always visible at the top
          if (currentScrollY <= 20) {
            setIsNavVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
            // Scrolling down
            setIsNavVisible(false);
          } else if (currentScrollY < lastScrollY) {
            // Scrolling up
            setIsNavVisible(true);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    ...(isAuthenticated ? [{ name: 'Home', path: '/' }] : []),
    ...(isAuthenticated
      ? [
          { name: user?.role === 'INDUSTRY' ? 'My Opportunities' : 'Opportunities', path: '/opportunities' },
          { name: 'Collaborations', path: '/collaborations' },
          { name: user?.role === 'INSTITUTION_ADMIN' ? 'Learning Programmes' : 'Learning Hub', path: '/learning' },
          ...(user?.role !== 'INDUSTRY'
            ? [{ name: user?.role === 'INSTITUTION_ADMIN' ? 'Mentorship Programmes' : 'Mentors', path: '/mentorship/mentors' }]
            : []),
        ]
      : []),
    ...(isAuthenticated && user?.role === 'STUDENT'
      ? [
          { name: 'My Applications', path: '/applications' },
          { name: 'My Offers', path: '/portal/student/offers' },
          { name: 'My Mentorship', path: '/portal/student/mentorship' },
        ]
      : []),
    ...(isAuthenticated && (user?.role === 'INDUSTRY' || user?.role === 'FACULTY')
      ? [
          { name: 'Mentor Workspace', path: '/portal/mentor/workspace' },
        ]
      : []),
    ...(isAuthenticated && user?.role === 'INDUSTRY'
      ? [
          { name: 'My Collaborations', path: '/industry/collaborations' },
          { name: 'Placements', path: '/portal/industry/placements' },
        ]
      : []),
    ...(isAuthenticated && user?.role === 'INSTITUTION_ADMIN'
      ? [
          { name: 'Institutional Analytics', path: '/analytics/institution' },
          { name: 'Placements', path: '/portal/institution/placements' },
        ]
      : []),
    ...(isAuthenticated && user?.role === 'SUPER_ADMIN' ? [{ name: 'Platform Analytics', path: '/analytics/platform' }] : []),
    ...(isAuthenticated ? [{ name: 'Dashboard', path: '/dashboard' }] : []),
  ];

  const shouldShowNav = isNavVisible || mobileMenuOpen;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header / Navigation Bar */}
      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-300 ease-in-out',
          'bg-white/75 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_1px_2px_0_rgba(0,0,0,0.02),0_4px_16px_-2px_rgba(0,0,0,0.03)]',
          !shouldShowNav && '-translate-y-full opacity-0 pointer-events-none',
          shouldShowNav && 'translate-y-0 opacity-100'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 min-w-0">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 text-slate-900 hover:opacity-90 transition-opacity shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent block leading-tight">
                CollabPortal
              </span>
            </Link>

            {/* Desktop Nav links (Distributed cleanly, no horizontal scrollbar) */}
            {navLinks.length > 0 && (
              <nav className="hidden xl:flex items-center justify-center gap-1 2xl:gap-1.5 flex-1 min-w-0 px-2 lg:px-4">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={cn(
                        'px-2.5 py-1.5 text-xs 2xl:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0',
                        isActive
                          ? 'bg-slate-100 text-brand-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right CTAs & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <NotificationBell />
                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    aria-label="Sign Out"
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm shadow-brand-500/20 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile menu button (visible when desktop nav hidden and navLinks exist) */}
              {navLinks.length > 0 && (
                <button
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="xl:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 pt-2 pb-4 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-lg transition-colors block',
                      isActive
                        ? 'bg-slate-100 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <React.Suspense fallback={<LoadingSpinner text="Loading page..." className="py-20" />}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900 text-base">
                  Academia–Industry Collaboration Platform
                </span>
              </div>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                CollabPortal — The unified platform for Academia–Industry
                Collaboration, Skill Mapping, Internships, and Placement.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Platform Roles
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  Students & Learners
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  Academicians & Faculty
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  Industries & Recruiters
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  Institution Administrators
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Platform Standards
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Deterministic Skill Matching</li>
                <li>Explainable Opportunity Scoring</li>
                <li>Verified Digital Portfolios</li>
                <li>WCAG AA Accessible Design</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 CollabPortal — Academia–Industry Collaboration. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/status" className="hover:text-slate-900 underline">
                System Status
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
