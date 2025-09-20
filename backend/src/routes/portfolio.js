const express = require("express");
const pool = require("../db/pool"); 
const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const { user_id, coin_id, amount, buy_price } = req.body;

    if (!user_id || !coin_id || !amount || !buy_price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO portfolio (user_id, coin_id, amount, buy_price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, coin_id, amount, buy_price]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error adding portfolio holding:", err.message);
    res.status(500).json({ error: "Failed to add holding" });
  }
});

router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM portfolio WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching portfolio:", err.message);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM portfolio WHERE id = $1`, [id]);

    res.json({ msg: "Holding deleted successfully" });
  } catch (err) {
    console.error("Error deleting holding:", err.message);
    res.status(500).json({ error: "Failed to delete holding" });
  }
});

module.exports = router;