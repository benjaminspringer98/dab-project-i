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

// could be cached
const getCount = async () => {
  const rows = await sql`SELECT COUNT(*) FROM programming_assignments;`
  return rows[0].count;
}

// could maybe be cached? have to be really careful though
const findCurrentAssignmentIdByUserUuid = async (userUuid) => {
  const row = await sql`SELECT id FROM programming_assignments WHERE assignment_order = 1;`
  const firstAssignmentId = row[0].id;

  // find id of last correctly submitted assignment
  const rows = await sql`SELECT s.programming_assignment_id, a.assignment_order FROM programming_assignment_submissions s
                          JOIN programming_assignments a ON s.programming_assignment_id = a.id 
                          WHERE s.user_uuid = ${userUuid} AND s.correct = true ORDER BY a.assignment_order DESC LIMIT 1;`;

  // correct submission found
  if (rows && rows.length > 0) {
    // increment order number of last correct submission to get current assignment
    const orderNumber = Number(rows[0].assignment_order) + 1;
    console.log("orderNumber", orderNumber)

    const row = await sql`SELECT id FROM programming_assignments WHERE assignment_order = ${orderNumber};`
    console.log("row", row)

    if (row && row.length > 0) {
      return row[0].id;
    }
  }

  // if no correct submissions, return id of first assignment
  return firstAssignmentId;
}

const findByOrder = async (order) => {
  const rows = await sql`SELECT * FROM programming_assignments WHERE assignment_order = ${order};`;

  if (rows && rows.length > 0) {
    return rows[0];
  }

  return false;
}

export { findAll, findById, getCount, findCurrentAssignmentIdByUserUuid, findByOrder };
