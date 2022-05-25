const Joi = require('joi');

const addMyWineSchema = Joi.object({
  wine_id: Joi.number().integer().required(),
  quantity: Joi.number().integer().required(),
});

module.exports = {
  addMyWineSchema,
};
