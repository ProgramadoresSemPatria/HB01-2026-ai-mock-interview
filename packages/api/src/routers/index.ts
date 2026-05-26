import { /* protectedProcedure, */ publicProcedure, router } from "../index";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  // TODO: Reativar quando auth MVC estiver implementada (T29)
  // Por enquanto, endpoint protegido está desabilitado
  // privateData: protectedProcedure.query(({ ctx }) => {
  //   return {
  //     message: "This is private",
  //     userId: ctx.userId,
  //   };
  // }),
});
export type AppRouter = typeof appRouter;
