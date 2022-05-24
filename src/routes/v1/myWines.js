const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const { mySQLconfig, jwtSecret } = require('../../config');

const patientShemas = require('../../models/winesSchemas');

const { isLoggedIn } = require('../../middleware/authorization');
const validation = require('../../middleware/validation');

const router = express.Router();

router.post(
  '/update_amount',
  isLoggedIn,
  validation(patientShemas, 'addPatientSchema'),
  async (req, res) => {
    try {
      req.body.doctor = jwt.verify(
        req.headers.authorization.split(' ')[1],
        jwtSecret,
      );

      const con = await mysql.createConnection(mySQLconfig);

      const [duplicateAccount] = await con.execute(`
  SELECT * FROM patient
  WHERE email = ${mysql.escape(
    req.body.email,
  )} OR identity_code = ${mysql.escape(req.body.identity_code)}
  `);

      if (duplicateAccount.length !== 0) {
        const [relationship] = await con.execute(`
        SELECT * FROM doctor_patient
        WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} 
        AND patient_id = ${mysql.escape(duplicateAccount[0].id)}
        `);

        if (relationship.length > 0) {
          await con.end();
          return res
            .status(400)
            .send({ error: 'This patient is already assigned to you.' });
        }

        const [response] = await con.execute(`
        INSERT INTO doctor_patient (doctor_id, patient_id)
        VALUES(${mysql.escape(req.body.doctor.id)}, ${mysql.escape(
          duplicateAccount[0].id,
        )})
        `);

        await con.end();

        if (!response.affectedRows) {
          return res
            .status(500)
            .send({ error: 'Server error. Try again later.' });
        }

        return res.send({
          msg: 'This patient already exists. We assigned the pattient to you :)',
        });
      }

      const [data] = await con.execute(`
      INSERT INTO patient (first_name, last_name, birth_date, gender, phone_number, email, photo, identity_code)
  
      VALUES (${mysql.escape(req.body.first_name)}, ${mysql.escape(
        req.body.last_name,
      )}, ${mysql.escape(req.body.birth_date)}, ${mysql.escape(
        req.body.gender,
      )}, ${mysql.escape(req.body.phone_number)}, ${mysql.escape(
        req.body.email,
      )},${mysql.escape(req.body.photo)}, ${mysql.escape(
        req.body.identity_code,
      )})
      `);

      if (!data.affectedRows) {
        return res
          .status(500)
          .send({ error: 'Server error. Try again later.' });
      }

      const [insertedPatient] = await con.execute(`
      SELECT id FROM patient
      WHERE email = ${mysql.escape(
        req.body.email,
      )} OR identity_code = ${mysql.escape(req.body.identity_code)}
      `);

      if (insertedPatient.length === 1) {
        const [addRelationship] = await con.execute(`
      INSERT INTO doctor_patient (doctor_id, patient_id)
      VALUES(${mysql.escape(req.body.doctor.id)}, ${mysql.escape(
          insertedPatient[0].id,
        )})
      `);
        if (!addRelationship.affectedRows) {
          return res.send({ msg: 'Server error. Try again later.' });
        }
      }

      await con.end();
      return res.send({ msg: 'Patient added' });
    } catch (err) {
      console.log(err);
      return res.status(500).send({ error: 'Server error. Try again later.' });
    }
  },
);

router.get('/get_collection', isLoggedIn, async (req, res) => {
  try {
    // Get all wines
    req.body.doctor = jwt.verify(
      req.headers.authorization.split(' ')[1],
      jwtSecret,
    );

    const con = await mysql.createConnection(mySQLconfig);

    const [data] = await con.execute(`
      SELECT first_name, last_name, birth_date, gender,
       email, photo, patient_id
       FROM patient
      JOIN doctor_patient
       ON doctor_patient.patient_id = patient.id
  WHERE doctor_id = ${mysql.escape(req.body.doctor.id)} AND archived = ${0}
  `);
    await con.end();
    return res.send({ patients: data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: 'Server error. Try again later.' });
  }
});

module.exports = router;
