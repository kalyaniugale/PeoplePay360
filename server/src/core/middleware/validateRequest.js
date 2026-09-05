export const validateRequest = (validator) => (req, _res, next) => {
  try {
    const validated = validator({ body: req.body, params: req.params, query: req.query });
    if (validated.body !== undefined) req.body = validated.body;
    if (validated.params !== undefined) req.params = validated.params;
    if (validated.query !== undefined) req.validatedQuery = validated.query;
    next();
  } catch (error) {
    next(error);
  }
};
