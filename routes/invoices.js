"use strict";
//import

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");

//const app = express();


/**
 * Gets all invoices
 * Returns:  {invoices: [{id, comp_code}, ...]}
 */

router.get("/", async function(req, res) {
  const results = await db.query(`
  SELECT id, comp_code
    FROM invoices
    ORDER BY id`);

  return res.json({ invoices : results.rows });
});


/**
 * Gets given invoice
 * Returns: {
 *    invoice:
 *      {id,
 *       amt,
 *       paid,
 *       add_date,
 *       paid_date,
 *       company: {
 *          code,
 *          name,
 *          description}}
 */

router.get("/:id", async function(req, res){
  const id = Number(req.params.id);

  const iResults = await db.query(`
  SELECT id, comp_code, amt, paid, add_date, paid_date
    FROM invoices
    WHERE id=$1`, [id]);

  const invoices = iResults.rows[0];

  if(invoices === undefined) throw new NotFoundError(`No matching invoice: ${id}`);

  const cResults = await db.query(`
  SELECT code, name, description
    FROM companies
    WHERE code= $1`, [invoices.comp_code]);

  const company = cResults.rows[0];

  delete invoices.comp_code;

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

  const comp_code = req.body.comp_code;
  const amt = req.body.amt;

  const results = await db.query(`
  INSERT INTO invoices (comp_code, amt)
    VALUES ($1, $2)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
  [comp_code, amt]);

  const invoice = results.rows[0];

  return res.status(201).json({ invoice });
});


/**
 * Edits an invoice
 * Receives: {amt}
 * Returns:  {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.put("/:id", async function(req, res) {
  if(req.body === undefined || "id" in req.body) throw new BadRequestError();

  const id = req.params.id;

  const results = await db.query(
    `UPDATE invoices
      SET amt=$1
      WHERE id=$2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [req.body.amt, id]
  );

  const invoice = results.rows[0];

  if (invoice === undefined) throw new NotFoundError(`No matching invoice: ${id}`);

  return res.json({ invoice });
});


/**
 * Deletes an invoice
 * Returns:  {status: "deleted"}
 */

router.delete("/:id", async function (req, res) {
  const id = req.params.id;

  const results = await db.query(
    `DELETE FROM invoices
      WHERE id = $1
      RETURNING id`, [id]
  );

  const invoice = results.rows[0];

  if (invoice === undefined) throw new NotFoundError(`No matching invoice: ${id}`);

  return res.json({status: "deleted"});
});



module.exports = router;