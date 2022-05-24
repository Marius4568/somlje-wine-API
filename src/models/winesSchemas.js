const Joi = require('joi');

const addWineSchema = Joi.object({
  title: Joi.string().trim().required(),
  region: Joi.string().trim().required(),
  year: Joi.number()
    .integer()
    .min(1800)
    .max(new Date().getFullYear())
    .required(),
});

module.exports = {
  addWineSchema,
};
