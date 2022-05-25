const express = require('express');
const mysql = require('mysql2/promise');

const { mySQLconfig } = require('../../config');

const winesSchemas = require('../../models/winesSchemas');

const { isLoggedIn } = require('../../middleware/authorization');
const {
  validateResultsQuery,
} = require('../../middleware/validateResultsQuery');

const validation = require('../../middleware/validation');

const router = express.Router();

router.post(
  '/add',
  isLoggedIn,
  validation(winesSchemas, 'addWineSchema'),
  async (req, res) => {
    try {
      const con = await mysql.createConnection(mySQLconfig);

      const [wineDuplicate] = await con.execute(`
SELECT title FROM wines
WHERE title = ${mysql.escape(req.body.title)}
`);

      if (wineDuplicate.length !== 0) {
        await con.end();
        return res
          .status(400)
          .send({ error: 'This wine is already in the database.' });
      }

      const [data] = await con.execute(`
    INSERT INTO wines (title, region, year)

    VALUES ( 
        ${mysql.escape(req.body.title)},
        ${mysql.escape(req.body.region)},
        ${mysql.escape(req.body.year)}
        )
    `);
      await con.end();

      if (!data.affectedRows) {
        return res
          .status(500)
          .send({ error: 'Server error. Try again later.' });
      }

      return res.send({ msg: 'wine added' });
    } catch (err) {
      console.log(err);
      return res.status(500).send({ error: 'Server error. Try again later.' });
    }
  },
);

router.get('/get_all', isLoggedIn, validateResultsQuery, async (req, res) => {
  try {
    const con = await mysql.createConnection(mySQLconfig);

    const [wines] = await con.execute(`
    SELECT title, region, year
     FROM wines
    LIMIT ${req.body.results ? req.body.results : 10000}
`);
    await con.end();

    return res.send({ wines });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error. Try again later.' });
  }
});

module.exports = router;
