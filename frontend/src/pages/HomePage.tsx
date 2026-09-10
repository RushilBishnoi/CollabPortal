import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  Building2,
  BookOpen,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

// Lightweight section-level scroll reveal hook with single-trigger & fallback support
function useScrollReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const el = ref.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, []);

  return { ref, isVisible };
}

interface PillarCardProps {
  stakeholder: {
    title: string;
    role: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeStyle: string;
    description: string;
    points: string[];
  };
  index: number;
  isVisible: boolean;
}

const PillarCard: React.FC<PillarCardProps> = ({ stakeholder, index, isVisible }) => {
  const Icon = stakeholder.icon;
  const isLeftCol = index % 2 === 0;

  return (
    <div
      style={{
        transitionDelay: isVisible ? `${index * 90}ms` : '0ms',
      }}
      className={cn(
        'group bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-subtle',
        'hover:shadow-card-hover hover:border-slate-300 transition-all duration-300 ease-out',
        'flex flex-col justify-between',
        isLeftCol
          ? 'hover:-translate-y-1 hover:rotate-[-2deg]'
          : 'hover:-translate-y-1 hover:rotate-[2deg]',
        'motion-reduce:hover:transform-none motion-reduce:transition-none',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5',
        'motion-reduce:opacity-100 motion-reduce:translate-y-0'
      )}
    >
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'w-10 h-10 rounded-xl border flex items-center justify-center font-semibold shrink-0 transition-transform duration-200 group-hover:scale-105 motion-reduce:group-hover:transform-none',
              stakeholder.badgeStyle
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {stakeholder.title}
            </h3>
            <span className="text-xs font-medium text-slate-500">
              {stakeholder.role}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
          {stakeholder.description}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <ul className="space-y-2">
          {stakeholder.points.map((pt) => (
            <li
              key={pt}
              className="flex items-center gap-2 text-xs font-medium text-slate-700"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              {pt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const HomePage: React.FC = () => {
  const [heroMounted, setHeroMounted] = useState(false);
  const loopReveal = useScrollReveal<HTMLElement>();
  const pillarsReveal = useScrollReveal<HTMLElement>();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeroMounted(true);
  }, []);

  // Extremely subtle cursor-reactive background tracking (desktop fine-pointer only, zero re-renders)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    const handlePointerMove = (e: PointerEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (gridRef.current) {
            const rect = gridRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (y >= -100 && y <= rect.height + 100) {
              gridRef.current.style.setProperty('--mouse-x', `${x}px`);
              gridRef.current.style.setProperty('--mouse-y', `${y}px`);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  const ecosystemStages = [
    {
      num: '01',
      stage: 'CONNECT',
      description: 'Profiles & Requirements',
    },
    {
      num: '02',
      stage: 'ALIGN',
      description: 'Skills & Readiness',
    },
    {
      num: '03',
      stage: 'COLLABORATE',
      description: 'Learning, Mentorship & Projects',
    },
    {
      num: '04',
      stage: 'OUTCOMES',
      description: 'Internships, Placements & Hiring',
    },
  ];

  const stakeholders = [
    {
      title: 'Students',
      role: 'Skill Profiling & Placement',
      icon: GraduationCap,
      badgeStyle: 'bg-brand-50 border-brand-200/80 text-brand-700',
      description:
        'Standardized skill assessments, deterministic gap analysis against industry standards, verified digital portfolio, and explainable internship matching.',
      points: [
        'Deterministic Skill Scoring',
        'Transparent Match Reasons',
        'Verified Digital Portfolio',
      ],
    },
    {
      title: 'Industry',
      role: 'Recruiters & Partners',
      icon: Briefcase,
      badgeStyle: 'bg-slate-100 border-slate-200/90 text-slate-800',
      description:
        'Define exact skill requirements, publish internships and jobs, discover pre-assessed candidates with transparent fit metrics, and host collaborative programs.',
      points: [
        'Candidate Fit Scoring',
        'Structured Recruitment Pipeline',
        'FDP & Workshop Collaboration',
      ],
    },
    {
      title: 'Faculty',
      role: 'Academicians & Mentors',
      icon: BookOpen,
      badgeStyle: 'bg-sky-50 border-sky-200/80 text-sky-800',
      description:
        'Access faculty industrial training, Faculty Development Programs (FDPs), industry research collaboration, and mentor student innovation projects.',
      points: [
        'Industrial Training & FDPs',
        'Research & Consultancy',
        'Student Project Mentorship',
      ],
    },
    {
      title: 'Institutions',
      role: 'Administration & T&P',
      icon: Building2,
      badgeStyle: 'bg-slate-100 border-slate-200/90 text-slate-700',
      description:
        'Institutional analytics on student skill readiness, aggregate curriculum gap analysis vs. live industry demand, and comprehensive placement tracking.',
      points: [
        'Curriculum vs Industry Gaps',
        'Placement Readiness Funnel',
        'Department-level Analytics',
      ],
    },
  ];

  return (
    <div className="relative py-8 pb-16 overflow-hidden">
      {/* Seamless Background Canvas (Blobs + Continuous Dot-Grid directly below Navbar) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      >
        {/* Blob 1 — Top Left (Near outer edge of Hero) */}
        <div className="absolute -top-20 -left-20 sm:-top-28 sm:-left-28 w-[420px] h-[420px] sm:w-[600px] sm:h-[600px] rounded-full bg-brand-500 opacity-[0.12] blur-[120px] sm:blur-[160px] animate-blob-1 motion-reduce:animate-none" />

        {/* Blob 2 — Mid Right (Between Ecosystem and Four Pillars) */}
        <div className="absolute top-[40%] -right-24 sm:-right-36 w-[440px] h-[440px] sm:w-[620px] sm:h-[620px] rounded-full bg-indigo-600 opacity-[0.11] blur-[130px] sm:blur-[170px] animate-blob-2 motion-reduce:animate-none" />

        {/* Blob 3 — Bottom Left (Lower content area) */}
        <div className="absolute -bottom-20 -left-20 sm:-bottom-28 sm:-left-28 w-[460px] h-[460px] sm:w-[640px] sm:h-[640px] rounded-full bg-teal-600 opacity-[0.10] blur-[140px] sm:blur-[180px] animate-blob-3 motion-reduce:animate-none" />

        {/* Continuous Dot Grid Layer (Top-aligned, seamless behind Navbar) */}
        <div
          ref={gridRef}
          className="absolute inset-x-0 top-0 h-[880px] overflow-hidden"
        >
          {/* Base Defined Dot Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#64748b_1.25px,transparent_1.25px)] [background-size:24px_24px] opacity-45 [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]" />

          {/* Cursor-Reactive Layer (Desktop non-touch only) */}
          <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-65 transition-opacity duration-300 [mask-image:radial-gradient(200px_circle_at_var(--mouse-x,-9999px)_var(--mouse-y,-9999px),black_0%,transparent_100%)] [-webkit-mask-image:radial-gradient(200px_circle_at_var(--mouse-x,-9999px)_var(--mouse-y,-9999px),black_0%,transparent_100%)] motion-reduce:hidden" />
        </div>
      </div>

      {/* Main Page Content Sections */}
      <div className="relative space-y-16">
        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              'text-center max-w-3xl mx-auto space-y-6 transition-all duration-500 ease-out',
              heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
              'motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none'
            )}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Bridging the Gap Between{' '}
              <span className="text-brand-600">
                Academic Skills
              </span>{' '}
              and Industry Demand
            </h1>

            <p className="text-base sm:text-lg font-medium text-slate-700 leading-relaxed max-w-[760px] mx-auto">
              A comprehensive, web-first platform designed to solve the talent-readiness
              mismatch through deterministic skill mapping, explainable opportunity
              recommendations, and verified academic-industry collaboration.
            </p>

            {/* Primary Hero CTA */}
            <div className="flex items-center justify-center pt-2">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs rounded-lg shadow-sm shadow-brand-600/10 hover:shadow-md hover:shadow-brand-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 motion-reduce:hover:transform-none"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:group-hover:transform-none" />
              </Link>
            </div>
          </div>
        </section>

        {/* CollabPortal Ecosystem Flow */}
        <section
          ref={loopReveal.ref}
          className={cn(
            'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out',
            loopReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            'motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none'
          )}
        >
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-slate-200/80">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                THE COLLABPORTAL ECOSYSTEM
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Connecting Academia, Skills & Industry
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                A shared platform where students, faculty, institutions, and industry align skills, collaboration, and career opportunities.
              </p>
            </div>

            {/* 4-Stage Ecosystem Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ecosystemStages.map((item, idx) => {
                return (
                  <div
                    key={item.stage}
                    style={{ transitionDelay: loopReveal.isVisible ? `${idx * 90}ms` : '0ms' }}
                    className={cn(
                      'flex flex-col transition-all duration-400 ease-out',
                      loopReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5',
                      'motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none'
                    )}
                  >
                    {/* Stage Header: Number & Stage Name */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-xs font-mono font-bold text-brand-600">
                        {item.num}
                      </span>
                      <span className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                        {item.stage}
                      </span>
                    </div>

                    {/* Dedicated Connector Row: Node + Horizontal Line to next stage */}
                    <div className="relative flex items-center mb-3.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-brand-600 shadow-sm flex items-center justify-center shrink-0 z-10">
                        <div className="w-0.5 h-0.5 rounded-full bg-brand-600" />
                      </div>
                      {idx < ecosystemStages.length - 1 && (
                        <div
                          aria-hidden="true"
                          className="hidden lg:block absolute left-2.5 right-[-1.5rem] h-px z-0 pointer-events-none"
                        >
                          <div
                            className={cn(
                              'w-full h-full',
                              idx === 0 && 'bg-gradient-to-r from-sky-400/60 to-brand-600/60',
                              idx === 1 && 'bg-gradient-to-r from-brand-600/60 to-indigo-600/60',
                              idx === 2 && 'bg-gradient-to-r from-indigo-600/60 to-teal-700/60'
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Stage Milestone Surface */}
                    <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 hover:shadow-subtle">
                      <p className="text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stakeholders Section (Four Pillars) */}
        <section
          ref={pillarsReveal.ref}
          className={cn(
            'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out',
            pillarsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            'motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none'
          )}
        >
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Designed for the Four Pillars of Education
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Every persona has dedicated workflows, secure authorization boundaries,
              and tailored dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stakeholders.map((s, idx) => (
              <PillarCard
                key={s.title}
                stakeholder={s}
                index={idx}
                isVisible={pillarsReveal.isVisible}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
