import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    teacherProcedure,
} from "~/server/api/trpc";

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
});
