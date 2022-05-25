const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const { mySQLconfig, jwtSecret } = require('../../config');

const myWinesSchemas = require('../../models/myWinesSchemas');

const { isLoggedIn } = require('../../middleware/authorization');
const validation = require('../../middleware/validation');

const router = express.Router();

router.post(
  '/add',
  isLoggedIn,
  validation(myWinesSchemas, 'addMyWineSchema'),
  async (req, res) => {
    try {
      req.body.user = jwt.verify(
        req.headers.authorization.split(' ')[1],
        jwtSecret,
      );
      const con = await mysql.createConnection(mySQLconfig);

      const [wineCollection] = await con.execute(`
      SELECT wine_id, user_id, quantity FROM collections
      WHERE user_id = ${mysql.escape(
        req.body.user.id,
      )} AND wine_id = ${mysql.escape(req.body.wine_id)}
      `);

      if (wineCollection.length !== 0) {
        const [data] = await con.execute(`
            UPDATE collections
            SET quantity = quantity + ${mysql.escape(req.body.quantity)}
            WHERE wine_id = ${mysql.escape(
              req.body.wine_id,
            )} AND user_id =  ${mysql.escape(req.body.user.id)};
            `);

        await con.end();

        if (!data.affectedRows) {
          return res
            .status(500)
            .send({ error: 'Server error. Try again later.' });
        }

        return res.send({
          msg: 'Collection updated',
        });
      }

      const [data] = await con.execute(`
      INSERT INTO collections (wine_id, user_id, quantity)
  
      VALUES (
      ${mysql.escape(req.body.wine_id)},
       ${mysql.escape(req.body.user.id)},
       ${mysql.escape(req.body.quantity)}
      )
      `);
      await con.end();

      if (!data.affectedRows) {
        return res
          .status(500)
          .send({ error: 'Server error. Try again later.' });
      }

      return res.send({ msg: 'My collection updated' });
    } catch (err) {
      console.log(err);
      return res.status(500).send({ error: 'Server error. Try again later.' });
    }
  },
);

router.get('/get_my_collection', isLoggedIn, async (req, res) => {
  try {
    // Get all wines that belong to the user
    req.body.user = jwt.verify(
      req.headers.authorization.split(' ')[1],
      jwtSecret,
    );
    const con = await mysql.createConnection(mySQLconfig);

    const [data] = await con.execute(`
    SELECT title, year, region, quantity
    FROM wines
   JOIN collections
    ON collections.wine_id = wines.id
WHERE user_id = ${mysql.escape(req.body.user.id)}
  `);
    await con.end();
    return res.send({ MyCollection: data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error. Try again later.' });
  }
});

module.exports = router;
