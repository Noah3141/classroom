import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, studentProcedure } from "~/server/api/trpc";
const TextAnswer = z.object({
    questionId: z.string(),
    value: z.string(),
});

const ChoiceAnswer = z.object({
    questionId: z.string(),
    value: z.number(),
});

const SubmitTestForm = z.object({
    testId: z.string(),
    classId: z.string(),
    textAnswers: z.array(TextAnswer),
    choiceAnswers: z.array(ChoiceAnswer),
});

const GradedAnswer = z.object({
    value: z.number(),
    questionId: z.string(),
    testTakerId: z.string(),
    submittedTestId: z.string(),
    correct: z.boolean(),
});

type GradedAnswer = z.infer<typeof GradedAnswer>;

export const studentRouter = createTRPCRouter({
    getSubmittedTests: studentProcedure
        // .input(z.object())
        .query(async ({ ctx }) => {
            const tests = await ctx.db.submittedTest.findMany({
                where: {
                    testTakerId: ctx.session.user.id,
                },
                orderBy: {
                    submissionDate: "desc",
                },
                include: {
                    test: true,
                    class: true,
                },
            });

            return tests;
        }),
    submitTest: studentProcedure
        .input(SubmitTestForm)
        .query(async ({ ctx, input }) => {
            const test = await ctx.db.test.findUnique({
                where: { id: input.testId },
                include: {
                    choiceQuestions: true,
                    textQuestions: true,
                },
            });

            if (!test) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No test found!",
                });
            }

            const submission = await ctx.db.submittedTest.create({
                data: {
                    testId: input.testId,
                    testTakerId: ctx.session.user.id,
                    classId: input.classId,
                },
            });

            const answerKey: Record<string, number> = {};
            test.choiceQuestions.map((question) => {
                answerKey[question.id] = question.correctAnswer;
            });

            const gradedAnswers: GradedAnswer[] = [];
            input.choiceAnswers.map(async (studentAnswer) => {
                const correct =
                    studentAnswer.value === answerKey[studentAnswer.questionId];

                const gradedAnswer = {
                    value: studentAnswer.value,
                    questionId: studentAnswer.questionId,
                    testTakerId: ctx.session.user.id,
                    submittedTestId: submission.id,
                    correct,
                };

                gradedAnswers.push(gradedAnswer);
            });

            await ctx.db.choiceAnswer.createMany({
                data: gradedAnswers,
            });

            if (!input.textAnswers.length) {
                let numberCorrect = 0;
                gradedAnswers.map((answer) => {
                    if (answer.correct) numberCorrect += 1;
                });
                const finalScore = numberCorrect / test.choiceQuestions.length;

                await ctx.db.submittedTest.update({
                    where: {
                        id: submission.id,
                    },
                    data: {
                        score: finalScore,
                    },
                });
                return {
                    graded: true,
                    submission,
                };
            } else {
                return {
                    graded: false,
                    submission,
                };
            }
        }),
    joinClass: studentProcedure
        .input(z.object({ classId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.class.update({
                where: {
                    id: input.classId,
                },
                data: {
                    students: {
                        connect: {
                            id: ctx.session.user.id,
                        },
                    },
                },
            });

            return true;
        }),
    getClasses: studentProcedure.query(async ({ ctx }) => {
        return await ctx.db.class.findMany({
            where: {
                students: {
                    some: { id: ctx.session.user.id },
                },
            },
            include: {
                _count: true,
            },
        });
    }),
});
