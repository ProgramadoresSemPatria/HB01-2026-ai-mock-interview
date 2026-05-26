import type { RequestHandler } from "express";
import { type ZodType, z } from "zod";

export function validate(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(422).json({
        message: "Validation failed",
        errors: z.treeifyError(result.error),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
