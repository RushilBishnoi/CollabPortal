import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlacementOffersService } from '../src/modules/placements/services/placement-offers.service';
import { PlacementsService } from '../src/modules/placements/services/placements.service';
import { PlacementLifecycleService } from '../src/modules/placements/services/placement-lifecycle.service';
import { PlacementDocumentsService } from '../src/modules/placements/services/placement-documents.service';
import { AnalyticsService } from '../src/modules/analytics/services/analytics.service';
import {
  ApplicationStatus,
  OfferStatus,
  PlacementStatus,
  UserRole,
  EmploymentType,
} from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

describe('Phase 13: Placement Workflow & Offer Management Spec', () => {
  let mockPrisma: any;
  let lifecycleService: PlacementLifecycleService;
  let offersService: PlacementOffersService;
  let placementsService: PlacementsService;
  let documentsService: PlacementDocumentsService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn((cb) => cb(mockPrisma)),
      industryProfile: {
        findUnique: vi.fn(),
      },
      studentProfile: {
        findUnique: vi.fn(),
      },
      institutionProfile: {
        findUnique: vi.fn(),
      },
      application: {
        findUnique: vi.fn(),
      },
      placementOffer: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      placement: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      offerStatusHistory: {
        create: vi.fn(),
      },
      placementStatusHistory: {
        create: vi.fn(),
      },
      placementDocument: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    lifecycleService = new PlacementLifecycleService();
    offersService = new PlacementOffersService(mockPrisma as any, lifecycleService);
    placementsService = new PlacementsService(mockPrisma as any, lifecycleService);
    documentsService = new PlacementDocumentsService(mockPrisma as any);
    analyticsService = new AnalyticsService(mockPrisma as any);
  });

  describe('Offer Creation & Validation', () => {
    it('should create a draft offer for a SELECTED candidate application', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: ApplicationStatus.SELECTED,
        opportunityId: 'opp-1',
        studentProfileId: 'student-1',
        placementOffer: null,
        opportunity: {
          id: 'opp-1',
          industryProfileId: 'ind-1',
        },
      });

      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-1',
        userId: 'user-ind-1',
      });

      mockPrisma.placementOffer.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'offer-1', ...data }),
      );

      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const joiningDate = new Date(Date.now() + 86400000 * 60).toISOString();

      const result = await offersService.createOffer('user-ind-1', UserRole.INDUSTRY, 'app-1', {
        title: 'Software Engineer Offer',
        designation: 'Associate Software Engineer',
        employmentType: EmploymentType.FULL_TIME,
        ctcAnnual: 1200000,
        joiningDate,
        offerExpiryDate: futureDate,
        workLocation: 'Bengaluru',
      });

      expect(result.id).toBe('offer-1');
      expect(result.status).toBe(OfferStatus.DRAFT);
      expect(result.ctcAnnual).toBe(1200000);
      expect(mockPrisma.offerStatusHistory.create).toHaveBeenCalled();
    });

    it('should reject offer creation if application is not in SELECTED status', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: ApplicationStatus.APPLIED,
        opportunityId: 'opp-1',
        studentProfileId: 'student-1',
        placementOffer: null,
        opportunity: { id: 'opp-1', industryProfileId: 'ind-1' },
      });

      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();

      await expect(
        offersService.createOffer('user-ind-1', UserRole.INDUSTRY, 'app-1', {
          title: 'Offer',
          designation: 'Engineer',
          joiningDate: futureDate,
          offerExpiryDate: futureDate,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject offer creation if recruiter does not own the opportunity (IDOR)', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: ApplicationStatus.SELECTED,
        opportunityId: 'opp-1',
        studentProfileId: 'student-1',
        placementOffer: null,
        opportunity: { id: 'opp-1', industryProfileId: 'other-ind' },
      });

      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'my-ind',
        userId: 'user-ind-1',
      });

      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();

      await expect(
        offersService.createOffer('user-ind-1', UserRole.INDUSTRY, 'app-1', {
          title: 'Offer',
          designation: 'Engineer',
          joiningDate: futureDate,
          offerExpiryDate: futureDate,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject duplicate offer creation for the same application', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: ApplicationStatus.SELECTED,
        opportunityId: 'opp-1',
        studentProfileId: 'student-1',
        placementOffer: { id: 'existing-offer' },
        opportunity: { id: 'opp-1', industryProfileId: 'ind-1' },
      });

      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-1',
        userId: 'user-ind-1',
      });

      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();

      await expect(
        offersService.createOffer('user-ind-1', UserRole.INDUSTRY, 'app-1', {
          title: 'Offer',
          designation: 'Engineer',
          joiningDate: futureDate,
          offerExpiryDate: futureDate,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Offer Issuance & State Transitions', () => {
    it('should allow industry to issue a draft offer (DRAFT -> ISSUED)', async () => {
      mockPrisma.placementOffer.findUnique.mockResolvedValue({
        id: 'offer-1',
        status: OfferStatus.DRAFT,
        industryProfileId: 'ind-1',
        offerExpiryDate: new Date(Date.now() + 86400000 * 10),
      });

      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-1',
        userId: 'user-ind-1',
      });

      mockPrisma.placementOffer.update.mockResolvedValue({
        id: 'offer-1',
        status: OfferStatus.ISSUED,
      });

      const result = await offersService.issueOffer('user-ind-1', UserRole.INDUSTRY, 'offer-1', 'Issued');
      expect(result.status).toBe(OfferStatus.ISSUED);
    });

    it('should reject invalid direct transitions like DRAFT -> ACCEPTED', () => {
      expect(() =>
        lifecycleService.validateOfferTransition(
          OfferStatus.DRAFT,
          OfferStatus.ACCEPTED,
          UserRole.STUDENT,
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('Student Offer Acceptance & Placement Creation', () => {
    it('should transition offer to ACCEPTED and create official Placement record in PENDING_VERIFICATION', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-student-1',
        institutionId: 'inst-1',
      });

      mockPrisma.placementOffer.findUnique.mockResolvedValue({
        id: 'offer-1',
        studentProfileId: 'student-1',
        industryProfileId: 'ind-1',
        status: OfferStatus.ISSUED,
        offerExpiryDate: new Date(Date.now() + 86400000 * 10),
        ctcAnnual: 1500000,
        title: 'Backend Engineer',
        designation: 'Backend Engineer',
        industryProfile: { companyName: 'Acme Corp' },
        studentProfile: { institutionId: 'inst-1' },
      });

      mockPrisma.placementOffer.update.mockResolvedValue({
        id: 'offer-1',
        status: OfferStatus.ACCEPTED,
      });

      mockPrisma.placement.create.mockResolvedValue({
        id: 'plc-1',
        offerId: 'offer-1',
        status: PlacementStatus.PENDING_VERIFICATION,
        annualCtcSnapshot: 1500000,
        companyNameSnapshot: 'Acme Corp',
        jobTitleSnapshot: 'Backend Engineer',
      });

      const result = await offersService.acceptOffer(
        'user-student-1',
        UserRole.STUDENT,
        'offer-1',
        'Excited to join!',
      );

      expect(result.offer.status).toBe(OfferStatus.ACCEPTED);
      expect(result.placement.status).toBe(PlacementStatus.PENDING_VERIFICATION);
      expect(mockPrisma.placement.create).toHaveBeenCalled();
      expect(mockPrisma.placementStatusHistory.create).toHaveBeenCalled();
    });

    it('should transition offer to DECLINED with decline reason', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-student-1',
      });

      mockPrisma.placementOffer.findUnique.mockResolvedValue({
        id: 'offer-1',
        studentProfileId: 'student-1',
        status: OfferStatus.ISSUED,
        offerExpiryDate: new Date(Date.now() + 86400000 * 10),
      });

      mockPrisma.placementOffer.update.mockResolvedValue({
        id: 'offer-1',
        status: OfferStatus.DECLINED,
      });

      const result = await offersService.declineOffer(
        'user-student-1',
        UserRole.STUDENT,
        'offer-1',
        {
          declineReason: 'Accepted another offer with higher CTC',
        },
      );

      expect(result.status).toBe(OfferStatus.DECLINED);
    });

    it('should reject acceptance of expired offers via lazy expiry check', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'student-1',
        userId: 'user-student-1',
      });

      mockPrisma.placementOffer.findUnique.mockResolvedValue({
        id: 'offer-1',
        studentProfileId: 'student-1',
        status: OfferStatus.ISSUED,
        offerExpiryDate: new Date(Date.now() - 86400000), // Expired yesterday
      });

      mockPrisma.placementOffer.update.mockResolvedValue({
        id: 'offer-1',
        status: OfferStatus.EXPIRED,
      });

      await expect(
        offersService.acceptOffer('user-student-1', UserRole.STUDENT, 'offer-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Institution TPO Placement Verification', () => {
    it('should verify placement and record NOC details', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue({
        id: 'inst-1',
        userId: 'user-tpo-1',
      });

      mockPrisma.placement.findUnique.mockResolvedValue({
        id: 'plc-1',
        institutionId: 'inst-1',
        status: PlacementStatus.PENDING_VERIFICATION,
      });

      mockPrisma.placement.update.mockResolvedValue({
        id: 'plc-1',
        status: PlacementStatus.VERIFIED,
        nocIssued: true,
        nocReferenceNumber: 'NOC-2026-001',
      });

      const result = await placementsService.verifyPlacement(
        'user-tpo-1',
        UserRole.INSTITUTION_ADMIN,
        'plc-1',
        {
          nocIssued: true,
          nocReferenceNumber: 'NOC-2026-001',
          verificationNotes: 'Approved by TPO Dean',
        },
      );

      expect(result.status).toBe(PlacementStatus.VERIFIED);
      expect(mockPrisma.placementStatusHistory.create).toHaveBeenCalled();
    });

    it('should reject TPO verification if placement belongs to another institution (IDOR)', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue({
        id: 'inst-my',
        userId: 'user-tpo-1',
      });

      mockPrisma.placement.findUnique.mockResolvedValue({
        id: 'plc-1',
        institutionId: 'inst-other',
        status: PlacementStatus.PENDING_VERIFICATION,
      });

      await expect(
        placementsService.verifyPlacement(
          'user-tpo-1',
          UserRole.INSTITUTION_ADMIN,
          'plc-1',
          { nocIssued: true },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should confirm student joining date (VERIFIED -> JOINED)', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue({
        id: 'inst-1',
        userId: 'user-tpo-1',
      });

      mockPrisma.placement.findUnique.mockResolvedValue({
        id: 'plc-1',
        institutionId: 'inst-1',
        status: PlacementStatus.VERIFIED,
      });

      mockPrisma.placement.update.mockResolvedValue({
        id: 'plc-1',
        status: PlacementStatus.JOINED,
        joiningConfirmed: true,
      });

      const joiningDate = new Date().toISOString();
      const result = await placementsService.confirmJoining(
        'user-tpo-1',
        UserRole.INSTITUTION_ADMIN,
        'plc-1',
        { actualJoiningDate: joiningDate },
      );

      expect(result.status).toBe(PlacementStatus.JOINED);
    });
  });

  describe('Document Security & Validation', () => {
    it('should reject document exceeding 5MB limit', async () => {
      mockPrisma.placementOffer.findUnique.mockResolvedValue({
        id: 'offer-1',
        industryProfileId: 'ind-1',
      });

      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-1',
        userId: 'user-ind-1',
      });

      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB

      await expect(
        documentsService.storeOfferDocument(
          'user-ind-1',
          UserRole.INDUSTRY,
          'offer-1',
          {
            originalFilename: 'offer.pdf',
            mimeType: 'application/pdf',
            buffer: largeBuffer,
            sizeBytes: largeBuffer.length,
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid document MIME type', async () => {
      mockPrisma.placementOffer.findUnique.mockResolvedValue({
        id: 'offer-1',
        industryProfileId: 'ind-1',
      });

      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-1',
        userId: 'user-ind-1',
      });

      await expect(
        documentsService.storeOfferDocument(
          'user-ind-1',
          UserRole.INDUSTRY,
          'offer-1',
          {
            originalFilename: 'script.exe',
            mimeType: 'application/x-msdownload',
            buffer: Buffer.from('malicious'),
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Placement Analytics Aggregations', () => {
    it('should calculate offer acceptance rate and average CTC accurately', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue({
        id: 'inst-1',
        userId: 'user-tpo-1',
      });

      mockPrisma.placement.count.mockResolvedValue(2);
      mockPrisma.placementOffer.findMany.mockResolvedValue([
        { id: 'o1', status: 'ACCEPTED', ctcAnnual: 1000000 },
        { id: 'o2', status: 'ACCEPTED', ctcAnnual: 2000000 },
        { id: 'o3', status: 'DECLINED', ctcAnnual: 800000 },
        { id: 'o4', status: 'ISSUED', ctcAnnual: 1200000 },
      ]);

      mockPrisma.placement.findMany.mockResolvedValue([
        { id: 'p1', status: 'VERIFIED', annualCtcSnapshot: 1000000, studentProfile: { department: 'CSE' } },
        { id: 'p2', status: 'JOINED', annualCtcSnapshot: 2000000, studentProfile: { department: 'CSE' } },
      ]);

      const analytics = await analyticsService.getPlacementAnalytics(
        'user-tpo-1',
        UserRole.INSTITUTION_ADMIN,
      );

      expect(analytics.summary.totalOffers).toBe(4);
      expect(analytics.summary.acceptedOffers).toBe(2);
      expect(analytics.summary.offerAcceptanceRate).toBe(50); // 2/4 = 50%
      expect(analytics.summary.averageCtcLpa).toBe(15); // (10L + 20L)/2 = 15 LPA
      expect(analytics.summary.highestCtcLpa).toBe(20); // 20 LPA
    });
  });
});
