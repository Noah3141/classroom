import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    teacherProcedure,
} from "~/server/api/trpc";

export type TextQuestion = z.infer<typeof TextQuestion>;
const TextQuestion = z.object({
    prompt: z.string(),
    type: z.enum(["Phrase", "ShortAnswer", "Essay"]),
});

export type ChoiceQuestion = z.infer<typeof ChoiceQuestion>;
const ChoiceQuestion = z.object({
    prompt: z.string(),
    correctAnswer: z.number(),
    choices: z.array(z.string()),
});

export type CreateTestForm = z.infer<typeof CreateTestForm>;
const CreateTestForm = z.object({
    title: z.string().nullable(),
    textQuestions: z.array(TextQuestion),
    choiceQuestions: z.array(ChoiceQuestion),
});

export const testRouter = createTRPCRouter({
    create: teacherProcedure
        .input(CreateTestForm)
        .mutation(async ({ ctx, input }) => {
            if (!input.title) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Please provide a title",
                });
            }

            const test = await ctx.db.test.create({
                data: {
                    title: input.title,
                    teacherId: ctx.session.user.id,
                },
            });

            const choiceQuestions = input.choiceQuestions.map((q) => ({
                ...q,
                testId: test.id,
            }));
            const textQuestions = input.textQuestions.map((q) => ({
                ...q,
                testId: test.id,
            }));

            await ctx.db.textQuestion.createMany({
                data: textQuestions,
            });

            await ctx.db.choiceQuestion.createMany({
                data: choiceQuestions,
            });

            return;
        }),
    getById: protectedProcedure
        .input(z.object({ testId: z.string().nullable() }))
        .query(async ({ ctx, input }) => {
            if (!input.testId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Something went wrong...",
                });
            }
            const test = await ctx.db.test.findUnique({
                where: {
                    id: input.testId,
                },
                include: {
                    choiceQuestions: true,
                    textQuestions: true,
                    submissions: {
                        include: { testTaker: true },
                    },
                    classes: true,
                },
            });
            if (!test) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No test found!",
                });
            }

            return test;
        }),
    remove: teacherProcedure
        .input(z.object({ testId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.db.test.delete({
                where: {
                    id: input.testId,
                },
            });
        }),

    getByIdWithStats: teacherProcedure
        .input(z.object({ testId: z.string().nullable() }))
        .query(async ({ ctx, input }) => {
            if (!input.testId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Something went wrong...",
                });
            }
            const test = await ctx.db.test.findUnique({
                where: {
                    id: input.testId,
                },
                include: {
                    choiceQuestions: true,
                    textQuestions: true,
                    submissions: {
                        include: { testTaker: true },
                    },
                    classes: true,
                },
            });

            if (!test) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No test found!",
                });
            }

            const choiceAnswers = await ctx.db.choiceAnswer.findMany({
                where: {
                    questionId: {
                        in: test.choiceQuestions.map((question) => question.id),
                    },
                },
            });

            test.choiceQuestions.forEach((question) => {
                question.choices.map((choice, choiceIndex) => {
                    let frequencyChosen = 0;
                    choiceAnswers.forEach((answer) => {
                        if (answer.value == choiceIndex) {
                            frequencyChosen += 1;
                        }
                    });

                    return {
                        text: choice,
                        frequencyChosen,
                    };
                });
            });

            return test;
        }),
});
