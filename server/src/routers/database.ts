import { Router } from "express";
import { neon } from "@neondatabase/serverless";

export default function database() {
  const router = Router();
  const sql = neon(process.env.DATABASE_URL || "");

  router
    .get("/", async (req, res) => {
      try {
        // Fetch the 50 latest messages ordered by created_at in descending order
        const result = await sql`
        SELECT * FROM messages
        ORDER BY created_at DESC
        LIMIT 50
      `;

        // Reorder the fetched messages in ascending order
        const orderedResult = result.reverse();

        res.status(200).json(orderedResult);
      } catch (error) {
        res.status(500).send("Error fetching messages");
      }
    })
    .post("/post", async (req, res) => {
      const { text } = req.body;
      const timestamp = new Date().toISOString();
      try {
        const result = await sql`
        INSERT INTO messages (text, created_at)
        VALUES (${text}, ${timestamp})
        RETURNING *;
      `;
        res.status(201).json(result[0]); // Return the inserted item
      } catch (error) {
        console.error("Error inserting message:", error);
        res.status(500).send("Error inserting message");
      }
    });

  return router;
}
