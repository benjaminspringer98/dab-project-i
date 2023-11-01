import { sql } from "../database/database.js";

const findAll = async () => {
  return await sql`SELECT * FROM programming_assignments;`;
};

const findById = async (id) => {
  const rows = await sql`SELECT * FROM programming_assignments WHERE id = ${id};`;

  if (rows && rows.length > 0) {
    return rows[0];
  }

  return false;
}



export { findAll, findById };
