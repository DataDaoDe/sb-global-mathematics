import { z } from "zod";

export const DisplayMathExpressionSchema = z
  .object({
    latex: z
      .string()
      .trim()
      .min(1, "Display math LaTeX cannot be empty"),

    description: z
      .string()
      .trim()
      .min(1, "Display math description cannot be empty")
      .optional(),
  })
  .strict();

export const DisplayMathSchema = z
  .array(DisplayMathExpressionSchema)
  .min(1, "At least one display math expression is required");

export type DisplayMathExpression = z.infer<
  typeof DisplayMathExpressionSchema
>;

export type DisplayMath = z.infer<typeof DisplayMathSchema>;
