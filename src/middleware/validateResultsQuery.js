module.exports = {
  validateResultsQuery: (req, res, next) => {
    try {
      let results = 10000;
      if (req.query.results) {
        const resultsQuery = req.query.results.split(',');
        if (resultsQuery.length === 2) {
          if (
            resultsQuery.every(
              (el) => typeof Number(el) === 'number' && Number(el) >= 0,
            )
          ) {
            results = req.query.results;
          }
        }
      }
      req.body.results = results;

      return next();
    } catch (err) {
      return res.status(400).send({ error: 'Incorrect query' });
    }
  },
};
