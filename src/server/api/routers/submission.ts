import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    teacherProcedure,
} from "~/server/api/trpc";

const GradeTestSchema = z.object({
    submissionId: z.string(),
});

export type GradeTestForm = z.infer<typeof GradeTestSchema>;

export const submissionRouter = createTRPCRouter({
    getWithTest: teacherProcedure
        .input(z.object({ submissionId: z.string() }))
        .query(async ({ ctx, input }) => {
            const submission = await ctx.db.submittedTest.findUnique({
                where: {
                    id: input.submissionId,
                },
                include: {
                    test: {
                        include: {
                            submissions: true,
                            choiceQuestions: true,
                            textQuestions: true,
                        },
                    },
                    class: true,
                    choiceAnswers: true,
                    textAnswers: true,
                },
            });

            if (!submission) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Could not find the submission in question!",
                });
            }

            const test = await ctx.db.test.findUnique({
                where: {
                    id: submission.testId,
                },
                include: {
                    submissions: {
                        include: { choiceAnswers: true },
                    },
                },
            });

            if (!test) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Could not find the test for this submission!",
                });
            }

            return {
                ...submission,
                allSubmissions: test.submissions,
            };
        }),
    grade: teacherProcedure
        .input(GradeTestSchema)
        .mutation(async ({ ctx, input }) => {
            const submission = await ctx.db.submittedTest.findUnique({
                where: {
                    id: input.submissionId,
                },
            });

            if (!submission) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Couldn't find the submission in question!",
                });
            }

            return "";
        }),
});
