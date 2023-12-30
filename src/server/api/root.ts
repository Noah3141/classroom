import { createTRPCRouter } from "~/server/api/trpc";
import { testRouter } from "./routers/test";
import { teacherRouter } from "./routers/teacher";
import { studentRouter } from "./routers/student";
import { classRouter } from "./routers/class";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    test: testRouter,
    teacher: teacherRouter,
    student: studentRouter,
    class: classRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
