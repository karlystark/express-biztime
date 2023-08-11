"use strict";
//import

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");

//const app = express();


/**
 * Gets a list of all companies
 * Returns:  {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(`
    SELECT code, name
      FROM companies`);

  return res.json({ companies: results.rows });
});


/**
 * Gets code, name, description and invoice information from company
 * Returns:  {company: {code, name, description,
 * invoices: [id...]}}
 */
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const cResults = await db.query(`
    SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]);

  const company = cResults.rows[0];

  if (company === undefined) throw new NotFoundError(`No matching company: ${code}`);

  const iResults = await db.query(`
    SELECT id
      FROM invoices
      WHERE comp_code= $1`, [code]);

  const invoices = (iResults.rows).map(el => el["id"]);

  company.invoices = invoices;

  return res.json({ company });
});


/**
 * Adds a company to the database
 * Receives: {code, name, description}
 * Returns:  {company: {code, name, description}}
 */
router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
    [req.body.code, req.body.name, req.body.description]);

  const company = results.rows[0];

  return res.status(201).json({ company });
});


/**
 * Edits an existing company
 * Receives: {name, description}
 * Returns:  {company: {code, name, description}}
 */

router.put("/:code", async function (req, res){
  if(req.body === undefined || "code" in req.body){
     throw new BadRequestError();
  }

  const code = req.params.code;

  const results = await db.query(
    `UPDATE companies
      SET name=$1, description=$2
      WHERE code=$3
      RETURNING code, name, description`,
      [req.body.name, req.body.description, code]);


  const company = results.rows[0];

  if(company === undefined) throw new NotFoundError(`No matching company: ${code}`);

  return res.json({ company });
});


/**
 * Deletes an existing company
 * Returns {status: "deleted"}
 */

router.delete("/:code", async function (req, res) {
  const code = req.params.code;
  const results = await db.query(
    "DELETE FROM companies WHERE code = $1 RETURNING code", [code]);

  const company = results.rows[0];

  if (company === undefined) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({status: "deleted"});

});





module.exports = router;