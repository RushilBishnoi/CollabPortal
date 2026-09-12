import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleGuard } from './components/common/RoleGuard';
import { RootLayout } from './layouts/RootLayout';
// Core & Public pages (lazy loaded)
const HomePage = React.lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const StatusPage = React.lazy(() => import('./pages/StatusPage').then((m) => ({ default: m.StatusPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ForbiddenPage = React.lazy(() => import('./pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })));

// Role-specific portal pages
const StudentPortalPage = React.lazy(() => import('./pages/portals/StudentPortalPage').then((m) => ({ default: m.StudentPortalPage })));
const FacultyPortalPage = React.lazy(() => import('./pages/portals/FacultyPortalPage').then((m) => ({ default: m.FacultyPortalPage })));
const IndustryPortalPage = React.lazy(() => import('./pages/portals/IndustryPortalPage').then((m) => ({ default: m.IndustryPortalPage })));
const InstitutionPortalPage = React.lazy(() => import('./pages/portals/InstitutionPortalPage').then((m) => ({ default: m.InstitutionPortalPage })));
const AdminPortalPage = React.lazy(() => import('./pages/portals/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage })));

// Profile pages
const StudentProfilePage = React.lazy(() => import('./pages/profiles/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })));
const FacultyProfilePage = React.lazy(() => import('./pages/profiles/FacultyProfilePage').then((m) => ({ default: m.FacultyProfilePage })));
const IndustryProfilePage = React.lazy(() => import('./pages/profiles/IndustryProfilePage').then((m) => ({ default: m.IndustryProfilePage })));
const InstitutionProfilePage = React.lazy(() => import('./pages/profiles/InstitutionProfilePage').then((m) => ({ default: m.InstitutionProfilePage })));

// Skill pages
const StudentSkillsPage = React.lazy(() => import('./pages/skills/StudentSkillsPage').then((m) => ({ default: m.StudentSkillsPage })));

// Assessment pages
const AssessmentsListPage = React.lazy(() => import('./pages/assessments/AssessmentsListPage').then((m) => ({ default: m.AssessmentsListPage })));
const AssessmentTakePage = React.lazy(() => import('./pages/assessments/AssessmentTakePage').then((m) => ({ default: m.AssessmentTakePage })));
const AssessmentResultPage = React.lazy(() => import('./pages/assessments/AssessmentResultPage').then((m) => ({ default: m.AssessmentResultPage })));
const MyAttemptsPage = React.lazy(() => import('./pages/assessments/MyAttemptsPage').then((m) => ({ default: m.MyAttemptsPage })));

// Career & Skill Gap pages (Phase 7)
const SkillGapDashboardPage = React.lazy(() => import('./pages/career/SkillGapDashboardPage').then((m) => ({ default: m.SkillGapDashboardPage })));
const CareerRecommendationsPage = React.lazy(() => import('./pages/career/CareerRecommendationsPage').then((m) => ({ default: m.CareerRecommendationsPage })));
const CareerRoleDetailPage = React.lazy(() => import('./pages/career/CareerRoleDetailPage').then((m) => ({ default: m.CareerRoleDetailPage })));

// Opportunities & Matching pages (Phase 8)
const OpportunityMarketplacePage = React.lazy(() => import('./pages/opportunities/OpportunityMarketplacePage').then((m) => ({ default: m.OpportunityMarketplacePage })));
const OpportunityDetailPage = React.lazy(() => import('./pages/opportunities/OpportunityDetailPage').then((m) => ({ default: m.OpportunityDetailPage })));
const IndustryOpportunitiesPage = React.lazy(() => import('./pages/opportunities/IndustryOpportunitiesPage').then((m) => ({ default: m.IndustryOpportunitiesPage })));
const CreateEditOpportunityPage = React.lazy(() => import('./pages/opportunities/CreateEditOpportunityPage').then((m) => ({ default: m.CreateEditOpportunityPage })));

// Applications & Recruitment pages (Phase 9)
const MyApplicationsPage = React.lazy(() => import('./pages/applications/MyApplicationsPage').then((m) => ({ default: m.MyApplicationsPage })));
const ApplicationDetailPage = React.lazy(() => import('./pages/applications/ApplicationDetailPage').then((m) => ({ default: m.ApplicationDetailPage })));
const OpportunityApplicationsPage = React.lazy(() => import('./pages/opportunities/OpportunityApplicationsPage').then((m) => ({ default: m.OpportunityApplicationsPage })));
const CandidateReviewPage = React.lazy(() => import('./pages/opportunities/CandidateReviewPage').then((m) => ({ default: m.CandidateReviewPage })));

// Institutional & Platform Analytics pages (Phase 10)
const InstitutionAnalyticsPage = React.lazy(() => import('./pages/analytics/InstitutionAnalyticsPage').then((m) => ({ default: m.InstitutionAnalyticsPage })));
const PlatformAnalyticsPage = React.lazy(() => import('./pages/analytics/PlatformAnalyticsPage').then((m) => ({ default: m.PlatformAnalyticsPage })));

// Academia–Industry Collaboration pages (Phase 11)
const CollaborationMarketplacePage = React.lazy(() => import('./pages/collaborations/CollaborationMarketplacePage').then((m) => ({ default: m.CollaborationMarketplacePage })));
const CollaborationDetailPage = React.lazy(() => import('./pages/collaborations/CollaborationDetailPage').then((m) => ({ default: m.CollaborationDetailPage })));
const CreateEditCollaborationPage = React.lazy(() => import('./pages/collaborations/CreateEditCollaborationPage').then((m) => ({ default: m.CreateEditCollaborationPage })));
const IndustryCollaborationsPage = React.lazy(() => import('./pages/collaborations/IndustryCollaborationsPage').then((m) => ({ default: m.IndustryCollaborationsPage })));
const CollaborationParticipantsPage = React.lazy(() => import('./pages/collaborations/CollaborationParticipantsPage').then((m) => ({ default: m.CollaborationParticipantsPage })));
const MyParticipationsPage = React.lazy(() => import('./pages/collaborations/MyParticipationsPage').then((m) => ({ default: m.MyParticipationsPage })));
const ParticipationDetailPage = React.lazy(() => import('./pages/collaborations/ParticipationDetailPage').then((m) => ({ default: m.ParticipationDetailPage })));

// Curated Learning & Guided Paths (Phase 12)
const LearningHubPage = React.lazy(() => import('./pages/learning/LearningHubPage').then((m) => ({ default: m.LearningHubPage })));
const LearningPathDetailPage = React.lazy(() => import('./pages/learning/LearningPathDetailPage').then((m) => ({ default: m.LearningPathDetailPage })));
const StudentLearningPage = React.lazy(() => import('./pages/learning/StudentLearningPage').then((m) => ({ default: m.StudentLearningPage })));
const SkillGapRemediationPage = React.lazy(() => import('./pages/learning/SkillGapRemediationPage').then((m) => ({ default: m.SkillGapRemediationPage })));
const ManageLearningPage = React.lazy(() => import('./pages/learning/ManageLearningPage').then((m) => ({ default: m.ManageLearningPage })));

// Placement Workflow & Offer Management pages (Phase 13)
const StudentOffersPage = React.lazy(() => import('./pages/placements/StudentOffersPage').then((m) => ({ default: m.StudentOffersPage })));
const OfferDetailPage = React.lazy(() => import('./pages/placements/OfferDetailPage').then((m) => ({ default: m.OfferDetailPage })));
const IndustryPlacementsPage = React.lazy(() => import('./pages/placements/IndustryPlacementsPage').then((m) => ({ default: m.IndustryPlacementsPage })));
const InstitutionPlacementsPage = React.lazy(() => import('./pages/placements/InstitutionPlacementsPage').then((m) => ({ default: m.InstitutionPlacementsPage })));

// Mentorship & Mentor Engagement pages (Phase 14)
const MentorDiscoveryPage = React.lazy(() => import('./pages/mentorship/MentorDiscoveryPage').then((m) => ({ default: m.MentorDiscoveryPage })));
const MentorProfileDetailPage = React.lazy(() => import('./pages/mentorship/MentorProfileDetailPage').then((m) => ({ default: m.MentorProfileDetailPage })));
const StudentMentorshipPage = React.lazy(() => import('./pages/mentorship/StudentMentorshipPage').then((m) => ({ default: m.StudentMentorshipPage })));
const MentorWorkspacePage = React.lazy(() => import('./pages/mentorship/MentorWorkspacePage').then((m) => ({ default: m.MentorWorkspacePage })));
const MentorshipSessionDetailPage = React.lazy(() => import('./pages/mentorship/MentorshipSessionDetailPage').then((m) => ({ default: m.MentorshipSessionDetailPage })));

// Notifications & Communication pages (Phase 15)
const NotificationsPage = React.lazy(() => import('./pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const NotificationPreferencesPage = React.lazy(() => import('./pages/notifications/NotificationPreferencesPage').then((m) => ({ default: m.NotificationPreferencesPage })));

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<RootLayout />}>
                {/* Public routes */}
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="status" element={<StatusPage />} />
                <Route path="forbidden" element={<ForbiddenPage />} />

                {/* Authenticated dashboard — role switching done inside DashboardPage */}
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Notifications & Preferences (Phase 15) */}
                <Route
                  path="notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="notifications/preferences"
                  element={
                    <ProtectedRoute>
                      <NotificationPreferencesPage />
                    </ProtectedRoute>
                  }
                />

                {/*
                 * Direct role-specific portal routes.
                 * Each is wrapped in ProtectedRoute (auth) + RoleGuard (role enforcement).
                 * Students, for example, cannot reach /portal/admin — they see ForbiddenPage.
                 */}
                <Route
                  path="portal/student"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <StudentPortalPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/faculty"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['FACULTY']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <FacultyPortalPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/industry"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <IndustryPortalPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/institution"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INSTITUTION_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <InstitutionPortalPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/admin"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <AdminPortalPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Profile routes */}
                <Route
                  path="profile/student"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <StudentProfilePage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile/student/skills"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <StudentSkillsPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile/faculty"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['FACULTY']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <FacultyProfilePage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile/industry"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <IndustryProfilePage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile/institution"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INSTITUTION_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <InstitutionProfilePage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Assessment routes */}
                <Route
                  path="assessments"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT', 'FACULTY', 'SUPER_ADMIN', 'INSTITUTION_ADMIN', 'INDUSTRY']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <AssessmentsListPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="assessments/my-attempts"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <MyAttemptsPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="assessments/:id/take"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <AssessmentTakePage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="assessments/attempts/:attemptId/result"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <AssessmentResultPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 7: Skill Gap Analysis & Career Mapping routes */}
                <Route
                  path="skill-gaps"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <SkillGapDashboardPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="career-recommendations"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <CareerRecommendationsPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="career-roles/:idOrSlug"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <CareerRoleDetailPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 8: Opportunities & Matching routes */}
                <Route
                  path="opportunities"
                  element={
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                      <OpportunityMarketplacePage />
                    </div>
                  }
                />
                <Route
                  path="opportunities/:idOrSlug"
                  element={
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                      <OpportunityDetailPage />
                    </div>
                  }
                />
                <Route
                  path="portal/industry/opportunities"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <IndustryOpportunitiesPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/industry/opportunities/new"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <CreateEditOpportunityPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/industry/opportunities/:id/edit"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <CreateEditOpportunityPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 9: Applications & Recruitment routes */}
                <Route
                  path="applications"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <MyApplicationsPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="applications/:id"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <ApplicationDetailPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/industry/opportunities/:opportunityId/applications"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <OpportunityApplicationsPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/industry/applications/:id"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <CandidateReviewPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 10: Institutional & Platform Analytics routes */}
                <Route
                  path="analytics/institution"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INSTITUTION_ADMIN', 'SUPER_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <InstitutionAnalyticsPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="analytics/platform"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <PlatformAnalyticsPage />
                        </div>
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 11: Academia–Industry Collaboration routes */}
                <Route path="collaborations" element={<CollaborationMarketplacePage />} />
                <Route path="collaborations/:id" element={<CollaborationDetailPage />} />

                {/* Faculty collaboration participations */}
                <Route
                  path="faculty/collaborations/my"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['FACULTY']}>
                        <MyParticipationsPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Student collaboration participations */}
                <Route
                  path="student/collaborations/my"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <MyParticipationsPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Candidate participation detail view */}
                <Route
                  path="collaborations/my-participations/:id"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['FACULTY', 'STUDENT', 'SUPER_ADMIN']}>
                        <ParticipationDetailPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Industry collaboration management & authoring */}
                <Route
                  path="industry/collaborations"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <IndustryCollaborationsPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="industry/collaborations/create"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <CreateEditCollaborationPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="industry/collaborations/:id/edit"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <CreateEditCollaborationPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="industry/collaborations/:id/participants"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <CollaborationParticipantsPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 12: Learning & Skill-Gap Remediation routes */}
                <Route path="learning" element={<LearningHubPage />} />
                <Route path="learning/paths/:id" element={<LearningPathDetailPage />} />
                <Route
                  path="learning/my-learning"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <StudentLearningPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="learning/remediation"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <SkillGapRemediationPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="learning/manage"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['FACULTY', 'INDUSTRY', 'SUPER_ADMIN']}>
                        <ManageLearningPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 13: Placement Workflow & Offer Management routes */}
                <Route
                  path="portal/student/offers"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <StudentOffersPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/student/offers/:id"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT']}>
                        <OfferDetailPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/industry/placements"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <IndustryPlacementsPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/industry/offers/:id"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'SUPER_ADMIN']}>
                        <OfferDetailPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/institution/placements"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INSTITUTION_ADMIN', 'SUPER_ADMIN']}>
                        <InstitutionPlacementsPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/institution/placements/:id"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INSTITUTION_ADMIN', 'SUPER_ADMIN']}>
                        <InstitutionPlacementsPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />

                {/* Phase 14: Mentorship & Mentor Engagement routes */}
                <Route path="mentorship" element={<MentorDiscoveryPage />} />
                <Route path="mentorship/mentors" element={<MentorDiscoveryPage />} />
                <Route path="mentorship/mentors/:id" element={<MentorProfileDetailPage />} />
                <Route
                  path="portal/student/mentorship"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['STUDENT', 'SUPER_ADMIN']}>
                        <StudentMentorshipPage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/mentor/workspace"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={['INDUSTRY', 'FACULTY', 'SUPER_ADMIN']}>
                        <MentorWorkspacePage />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="portal/mentorship/sessions/:id"
                  element={
                    <ProtectedRoute>
                      <MentorshipSessionDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 15: Notifications & Preferences routes */}
                <Route
                  path="notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="notifications/preferences"
                  element={
                    <ProtectedRoute>
                      <NotificationPreferencesPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
