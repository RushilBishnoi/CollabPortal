import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, MentorshipSession } from '@prisma/client';
import { SetAvailabilityDto } from '../dto/set-availability.dto';

@Injectable()
export class MentorAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Set weekly recurring availability slots for mentor
   */
  async setAvailability(userId: string, dto: SetAvailabilityDto) {
    const mentorProfile = await this.prisma.mentorProfile.findUnique({
      where: { userId },
    });

    if (!mentorProfile) {
      throw new NotFoundException('Mentor profile not found. Please create your profile first.');
    }

    // Validate slot time logic
    for (const slot of dto.slots) {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes >= endMinutes) {
        throw new BadRequestException(
          `Invalid slot on day ${slot.dayOfWeek}: startTime (${slot.startTime}) must be earlier than endTime (${slot.endTime}).`,
        );
      }
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.mentorAvailability.deleteMany({
        where: { mentorProfileId: mentorProfile.id },
      });

      if (dto.slots.length > 0) {
        await tx.mentorAvailability.createMany({
          data: dto.slots.map((s) => ({
            mentorProfileId: mentorProfile.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            slotDurationMins: s.slotDurationMins ?? 45,
            isRecurring: s.isRecurring ?? true,
          })),
        });
      }

      return tx.mentorAvailability.findMany({
        where: { mentorProfileId: mentorProfile.id },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  }

  /**
   * Get availability configuration for a mentor
   */
  async getMentorAvailability(mentorProfileId: string) {
    return this.prisma.mentorAvailability.findMany({
      where: { mentorProfileId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Compute concrete available booking slots for a specific date (YYYY-MM-DD)
   */
  async getAvailableSlotsForDate(mentorProfileId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD.');
    }

    const dayOfWeek = targetDate.getUTCDay();

    const [availabilities, existingSessions] = await Promise.all([
      this.prisma.mentorAvailability.findMany({
        where: { mentorProfileId, dayOfWeek },
      }),
      this.prisma.mentorshipSession.findMany({
        where: {
          mentorProfileId,
          status: { in: ['SCHEDULED', 'RESCHEDULED'] },
          scheduledAt: {
            gte: new Date(`${dateStr}T00:00:00.000Z`),
            lte: new Date(`${dateStr}T23:59:59.999Z`),
          },
        },
      }),
    ]);

    const slots: Array<{
      startTime: string;
      endTime: string;
      scheduledAt: string;
      durationMinutes: number;
      isBooked: boolean;
    }> = [];

    const now = Date.now();

    for (const rule of availabilities) {
      const [startH, startM] = rule.startTime.split(':').map(Number);
      const [endH, endM] = rule.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const duration = rule.slotDurationMins;

      for (let curr = startMinutes; curr + duration <= endMinutes; curr += duration) {
        const h = Math.floor(curr / 60).toString().padStart(2, '0');
        const m = (curr % 60).toString().padStart(2, '0');
        const endHStr = Math.floor((curr + duration) / 60).toString().padStart(2, '0');
        const endMStr = ((curr + duration) % 60).toString().padStart(2, '0');

        const scheduledAtIso = `${dateStr}T${h}:${m}:00.000Z`;
        const slotStartTime = new Date(scheduledAtIso).getTime();
        const slotEndTime = slotStartTime + duration * 60 * 1000;

        // Skip slots in the past (less than 15 mins from now)
        if (slotStartTime <= now + 15 * 60 * 1000) {
          continue;
        }

        // Check if overlaps with any active session
        const isBooked = existingSessions.some((session: MentorshipSession) => {
          const sessionStart = new Date(session.scheduledAt).getTime();
          const sessionEnd = sessionStart + session.durationMinutes * 60 * 1000;
          return slotStartTime < sessionEnd && slotEndTime > sessionStart;
        });

        slots.push({
          startTime: `${h}:${m}`,
          endTime: `${endHStr}:${endMStr}`,
          scheduledAt: scheduledAtIso,
          durationMinutes: duration,
          isBooked,
        });
      }
    }

    return slots;
  }
}
