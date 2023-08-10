//import

const express = require("express");
const { NotFoundError } = require("../expressError");

const router = new express.Router();
const db = require("../db");

const app = express();

router.get("/", async function (req, res) {
  const results = await db.query("SELECT code, name FROM companies");

  return res.json({companies: results.rows});
});

router.get("/:code", async function (req, res) {
  const code = req.params.code;
  const results = await db.query(`
    SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });
})


module.exports = router;