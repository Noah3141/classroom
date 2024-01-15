import { ChoiceAnswer } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { randomInt, randomUUID } from "crypto";
import { z } from "zod";

import {
    adminProcedure,
    createTRPCRouter,
    protectedProcedure,
    teacherProcedure,
} from "~/server/api/trpc";

export const adminRouter = createTRPCRouter({
    generateFakeSubmission: adminProcedure.mutation(async ({ ctx }) => {
        const fakeId = randomUUID();
        const classId = (await ctx.db.class.findFirst())?.id ?? "admin";
        const test = await ctx.db.test.findFirst({
            include: { choiceQuestions: true },
        });

        if (!test) {
            throw new TRPCError({ code: "NOT_FOUND" });
        }

        const newSubmission = await ctx.db.submittedTest.create({
            data: {
                score: null,
                classId,
                testId: test.id,
                testTakerId: fakeId,
            },
        });

        const choiceAnswersData: ChoiceAnswer[] = await Promise.all(
            test.choiceQuestions.map(async (question) => {
                const value = randomInt(1, question.choices.length + 1);

                const otherChoiceAnswers = await ctx.db.choiceAnswer.findMany({
                    where: {
                        questionId: question.id,
                        value: value,
                    },
                });

                return {
                    questionId: question.id,
                    testTakerId: fakeId,
                    submittedTestId: newSubmission.id,
                    correct: question.correctAnswer == value,
                    frequency: otherChoiceAnswers.length,
                    value,
                };
            }),
        );
        const choiceAnswers = await ctx.db.choiceAnswer.createMany({
            data: choiceAnswersData,
        });
    }),
});
