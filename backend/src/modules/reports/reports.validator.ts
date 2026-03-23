import { z } from 'zod';

export const reportSchema = z.object({
    patientCount: z.number().int().positive(),
    originLocation: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional()
    }),
    symptomMatrix: z.array(z.string()).nonempty(),
    severity: z.number().min(1).max(10),
    notes: z.string().optional()
});

export type ReportInput = z.infer<typeof reportSchema>;
