import { SubmittedTest } from "@prisma/client";
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


const GradedChoiceAnswer = z.object({
    value: z.number(),
    questionId: z.string(),
    testTakerId: z.string(),
    submittedTestId: z.string(),
    correct: z.boolean(),
    frequency: z.number(),
});

export type GradedChoiceAnswer = z.infer<typeof GradedChoiceAnswer>;
export type TextAnswer = z.infer<typeof TextAnswer>;
export type ChoiceAnswer = z.infer<typeof ChoiceAnswer>;
export type SubmitTestForm = z.infer<typeof SubmitTestForm>;

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
        .mutation(async ({ ctx, input }) => {
            // Find the test in question
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
                    message: "The test in question could not be found!",
                });
            }

            // Check if this user already has a submission for that test
            const alreadySubmitted: SubmittedTest | null =
                await ctx.db.submittedTest.findFirst({
                    where: {
                        testTakerId: ctx.session.user.id,
                        testId: input.testId,
                        classId: input.classId,
                    },
                });

            const wasResubmit = !!alreadySubmitted;

            if (wasResubmit) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "You've already submitted this test!",
                });
            }

            // Todo Offer update functionality?

            // Create submission to start writing to
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

            const gradedChoiceAnswers: GradedChoiceAnswer[] = await Promise.all(
                input.choiceAnswers.map(async (studentAnswer) => {
                    const correct =
                        studentAnswer.value ===
                        answerKey[studentAnswer.questionId];

                    const otherChoiceAnswers =
                        await ctx.db.choiceAnswer.findMany({
                            where: {
                                questionId: studentAnswer.questionId,
                                value: studentAnswer.value,
                            },
                        });

                    const gradedChoiceAnswer = {
                        value: studentAnswer.value,
                        questionId: studentAnswer.questionId,
                        testTakerId: ctx.session.user.id,
                        submittedTestId: submission.id,
                        frequency: otherChoiceAnswers.length,
                        correct,
                    };

                    return gradedChoiceAnswer;
                }),
            );

            await ctx.db.choiceAnswer.createMany({
                data: gradedChoiceAnswers,
            });

            // If no text answers, we can grade right away:
            if (!input.textAnswers.length) {
                let numberCorrect = 0;
                gradedChoiceAnswers.map((answer) => {
                    if (answer.correct) numberCorrect += 1;
                });
                const finalScore =
                    (numberCorrect / test.choiceQuestions.length) * 100;

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
                    wasResubmit: wasResubmit,
                    submission,
                };
            } else {
                const ungradedTextAnswers = input.textAnswers.map(
                    (textAnswer) => {
                        return {
                            questionId: textAnswer.questionId,
                            submittedTestId: submission.id,
                            testTakerId: ctx.session.user.id,
                            value: textAnswer.value,
                            correct: null,
                        };
                    },
                );

                await ctx.db.textAnswer.createMany({
                    data: ungradedTextAnswers,
                });

                return {
                    graded: false,
                    wasResubmit: wasResubmit,
                    submission,
                };
            }
        }),
    joinClass: studentProcedure
        .input(z.object({ classId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const classroom = await ctx.db.class.findUnique({
                where: {
                    id: input.classId,
                },
                include: {
                    students: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (!classroom) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Couldn't locate the class in question!",
                });
            }

            if (
                classroom.students.some(
                    (student) => student.id == ctx.session.user.id,
                )
            ) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "You appear to already be in this class!",
                });
            }

            const res = await ctx.db.user.update({
                where: { id: ctx.session.user.id },
                data: {
                    classes: {
                        connect: { id: input.classId },
                    },
                },
            });

            const inClass = await ctx.db.class.findUnique({
                where: { id: input.classId },
                include: {
                    students: {
                        select: { id: true },
                    },
                },
            });
            if (
                !inClass ||
                !inClass.students.some(
                    (student) => student.id == ctx.session.user.id,
                )
            ) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Something went wrong adding you to the class!",
                });
            }
        }),
    getClasses: studentProcedure.query(async ({ ctx }) => {
        return await ctx.db.class.findMany({
            where: {
                students: { some: { id: ctx.session.user.id } },
            },
            include: {
                _count: true,
            },
        });
    }),
});
