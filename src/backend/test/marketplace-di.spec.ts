import { describe, it, expect } from 'vitest';
import { OpportunitiesController } from '../src/modules/opportunities/controllers/opportunities.controller';
import { IndustryOpportunitiesController } from '../src/modules/opportunities/controllers/industry-opportunities.controller';
import { OpportunitiesService } from '../src/modules/opportunities/services/opportunities.service';
import { OpportunityMatchingService } from '../src/modules/opportunities/services/opportunity-matching.service';
import { CollaborationsController } from '../src/modules/collaborations/controllers/collaborations.controller';
import { StudentCollaborationsController } from '../src/modules/collaborations/controllers/student-collaborations.controller';
import { FacultyCollaborationsController } from '../src/modules/collaborations/controllers/faculty-collaborations.controller';
import { ParticipationController } from '../src/modules/collaborations/controllers/participation.controller';
import { CollaborationsService } from '../src/modules/collaborations/services/collaborations.service';
import { ParticipationService } from '../src/modules/collaborations/services/participation.service';
import { CollaborationLifecycleService } from '../src/modules/collaborations/services/collaboration-lifecycle.service';
import { PrismaService } from '../src/database/prisma.service';

describe('Marketplace Modules Explicit Dependency Injection Metadata Regression Tests', () => {
  describe('Opportunities Module DI Metadata', () => {
    it('should have explicit @Inject metadata on OpportunitiesController constructor parameters', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', OpportunitiesController);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === OpportunitiesService)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 1 && param.param === OpportunityMatchingService)).toBe(true);
    });

    it('should have explicit @Inject metadata on IndustryOpportunitiesController constructor parameter', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', IndustryOpportunitiesController);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === OpportunitiesService)).toBe(true);
    });

    it('should have explicit @Inject metadata on OpportunitiesService constructor parameter', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', OpportunitiesService);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === PrismaService)).toBe(true);
    });

    it('should have explicit @Inject metadata on OpportunityMatchingService constructor parameter', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', OpportunityMatchingService);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === PrismaService)).toBe(true);
    });
  });

  describe('Collaborations Module DI Metadata', () => {
    it('should have explicit @Inject metadata on CollaborationsController constructor parameter', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', CollaborationsController);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === CollaborationsService)).toBe(true);
    });

    it('should have explicit @Inject metadata on StudentCollaborationsController constructor parameters', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', StudentCollaborationsController);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === CollaborationsService)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 1 && param.param === ParticipationService)).toBe(true);
    });

    it('should have explicit @Inject metadata on FacultyCollaborationsController constructor parameters', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', FacultyCollaborationsController);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === CollaborationsService)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 1 && param.param === ParticipationService)).toBe(true);
    });

    it('should have explicit @Inject metadata on ParticipationController constructor parameter', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', ParticipationController);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === ParticipationService)).toBe(true);
    });

    it('should have explicit @Inject metadata on CollaborationsService constructor parameters', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', CollaborationsService);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === PrismaService)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 1 && param.param === CollaborationLifecycleService)).toBe(true);
    });

    it('should have explicit @Inject metadata on ParticipationService constructor parameters', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', ParticipationService);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === PrismaService)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 1 && param.param === CollaborationLifecycleService)).toBe(true);
    });
  });
});
