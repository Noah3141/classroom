import { ChoiceAnswer, ChoiceQuestion } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    teacherProcedure,
} from "~/server/api/trpc";
import { addStatsToQuestions } from "../utils/dataCombinations";

const GradeTestSchema = z.object({
    submissionId: z.string(),
});

export type GradeTestForm = z.infer<typeof GradeTestSchema>;

export const submissionRouter = createTRPCRouter({
    getById: teacherProcedure
        .input(z.object({ submissionId: z.string() }))
        .query(async ({ ctx, input }) => {
            const submission = await ctx.db.submittedTest.findUnique({
                where: {
                    id: input.submissionId,
                },
                include: {
                    test: true,
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

            return submission;
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

    getWithTestAndStats: teacherProcedure
        .input(z.object({ submissionId: z.string() }))
        .query(async ({ ctx, input }) => {
            const submission = await ctx.db.submittedTest.findUnique({
                where: {
                    id: input.submissionId,
                },
                include: {
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
                    choiceQuestions: true,
                    textQuestions: true,
                },
            });

            if (!test) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Could not find the test in question!",
                });
            }

            const choiceAnswersProvidedForThisTest =
                await ctx.db.choiceAnswer.findMany({
                    where: {
                        questionId: {
                            in: test.choiceQuestions.map(
                                (question) => question.id,
                            ),
                        },
                    },
                });

            const addStats = {
                submission: submission,
                test: {
                    ...test,
                    choiceQuestions: addStatsToQuestions({
                        choiceQuestions: test.choiceQuestions,
                        choiceAnswers: choiceAnswersProvidedForThisTest,
                    }),
                },
            };

            return addStats;
        }),
});
