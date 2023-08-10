"use strict";
//import

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");

const app = express();


/**
 * Gets all invoices
 * Returns:  {invoices: [{id, comp_code}, ...]}
 */

router.get("/", async function(req, res) {
  const results = await db.query(`
  SELECT id, comp_code
    FROM invoices`);

  return res.json({ invoices : results.rows });
});


/**
 * Gets given invoice
 * Returns:  {invoice: {id, amt, paid, add_date, paid_date,
 * company: {code, name, description}}
 */

router.get("/:id", async function(req, res){
  const id = req.params.id;

  const iResults = await db.query(`
  SELECT id, amt, paid, add_date, paid_date
    FROM invoices
    WHERE id = $1`, [id]);

  const invoices = iResults.rows[0];

  if(invoices === undefined) throw new NotFoundError(`No matching invoice: ${id}`);

  const comp_code = invoices.comp_code;

  const cResults = await db.query(`
  SELECT code, name, description
    FROM companies
    WHERE code = ${comp_code}`);

  const company = cResults.rows[0];

  invoices.company = company;

  return res.json({ invoice: invoices });

});



/**
 * Adds an invoice to the database
 * Receives: {comp_code, amt}
 * Returns:  {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.post("/", async function(req, res){
  if(req.body === undefined) throw new BadRequestError();

  const results = await db.query(`
  INSERT INTO invoices (comp_code, amt)
    VALUES ($1, $2)
    RETURNING id, comp_code, amt, paid, add_data, paid_date`,
  [req.body.comp_code, req.body.amt]);

  const invoice = results.rows[0];

  return res.status(201).json({ invoice });
});






module.exports = router;