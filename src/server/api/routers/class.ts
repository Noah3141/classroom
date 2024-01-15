import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    studentProcedure,
    teacherProcedure,
} from "~/server/api/trpc";
import { ClassSubmissions } from "~/utils/api";

export const classRouter = createTRPCRouter({
    getByTeacherId: teacherProcedure.query(async ({ ctx }) => {
        const classes = await ctx.db.class.findMany({
            where: {
                teacherId: ctx.session.user.id,
            },
            include: {
                _count: true,
            },
            orderBy: [
                { lastSubmission: "desc" },
                { season: "asc" },
                { title: "desc" },
            ],
        });

        return classes;
    }),
    getById: protectedProcedure
        .input(z.object({ classId: z.string().nullable() }))
        .query(async ({ ctx, input }) => {
            if (!input.classId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No class specified!",
                });
            }

            const classroom = await ctx.db.class.findUnique({
                where: {
                    id: input.classId,
                },
                include: {
                    _count: true,
                },
            });

            if (!classroom) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No class found!",
                });
            }

            return classroom;
        }),
    getIfStudent: studentProcedure
        .input(z.object({ classId: z.string().nullable() }))
        .query(async ({ ctx, input }) => {
            if (!input.classId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No class specified!",
                });
            }

            const classroom = await ctx.db.class.findUnique({
                where: {
                    id: input.classId,
                },
                include: { students: { select: { id: true } }, _count: true },
            });

            if (!classroom) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No class found!",
                });
            }

            return classroom;
        }),
    getSubmissions: teacherProcedure
        .input(z.object({ classId: z.string() }))
        .query(async ({ ctx, input }) => {
            const submissions = await ctx.db.submittedTest.findMany({
                where: {
                    classId: input.classId,
                    class: {
                        teacherId: ctx.session.user.id,
                    },
                },
                include: {
                    testTaker: true,
                    test: true,
                    _count: true,
                },
            });

            return submissions;
        }),
});
