import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, teacherProcedure } from "~/server/api/trpc";

const CreateClassForm = z.object({
    season: z.enum(["Fall", "Winter", "Spring", "Summer"]),
    title: z.string().nullable(),
    year: z.number().min(1997).max(2100),
});

export type CreateClassForm = z.infer<typeof CreateClassForm>;

export const teacherRouter = createTRPCRouter({
    /** Get the tests */
    getTests: teacherProcedure
        // .input(z.object())
        .query(async ({ ctx }) => {
            const tests = await ctx.db.test.findMany({
                where: {
                    teacherId: ctx.session.user.id,
                },
                orderBy: { lastSubmission: { sort: "desc", nulls: "first" } },
                include: {
                    _count: {
                        select: {
                            submissions: true,
                            choiceQuestions: true,
                            textQuestions: true,
                        },
                    },
                },
            });

            return tests.map((test) => ({
                length: test._count.choiceQuestions + test._count.textQuestions,
                submissions: test._count.submissions,
                ...test,
            }));
        }),
    /** Get tests with their related objects */
    getTestsFull: teacherProcedure
        // .input(z.object())
        .query(async ({ ctx }) => {
            const tests = await ctx.db.test.findMany({
                where: {
                    teacherId: ctx.session.user.id,
                },
                orderBy: { lastSubmission: { sort: "desc", nulls: "first" } },
                include: {
                    choiceQuestions: true,
                    textQuestions: true,
                    submissions: true,
                },
            });

            return tests;
        }),
    // getStudents:
    createClass: teacherProcedure
        .input(CreateClassForm)
        .mutation(async ({ ctx, input }) => {
            if (!input.title) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Please provide a title",
                });
            }

            const already_exists = await ctx.db.class.findFirst({
                where: {
                    title: input.title,
                    season: input.season,
                    schoolYear: input.year,
                    teacherId: ctx.session.user.id,
                },
            });

            if (!!already_exists) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "You appear to already have this exact class created! You'll have to modify one of the fields to create a new one.",
                });
            }

            const classroom = await ctx.db.class.create({
                data: {
                    title: input.title,
                    season: input.season,
                    schoolYear: input.year,
                    teacherId: ctx.session.user.id,
                },
            });
            return classroom;
        }),
    removeClass: teacherProcedure
        .input(
            z.object({
                classId: z.string().nullable(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            if (!input.classId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Please specify a class to remove!",
                });
            }

            const classroom = await ctx.db.class.findUnique({
                where: { id: input.classId },
            });

            if (!classroom) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No such class to remove!",
                });
            }

            if (classroom.teacherId !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Hey, that's not your class!",
                });
            }

            const deleted = await ctx.db.class.delete({
                where: {
                    id: input.classId,
                },
            });
        }),
});
