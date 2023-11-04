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

const findNextByOrder = async (order) => {
  const rows = await sql`SELECT * FROM programming_assignments WHERE assignment_order = ${Number(order) + 1};`;

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
const findNextUncompletedForUser = async (userUuid) => {
  const rows = await sql`SELECT a.id
    FROM programming_assignments a
    LEFT JOIN (
      SELECT programming_assignment_id, BOOL_OR(correct) as has_correct_submission
      FROM programming_assignment_submissions
      WHERE user_uuid = ${userUuid}
      GROUP BY programming_assignment_id
    ) as s ON a.id = s.programming_assignment_id
    WHERE s.has_correct_submission IS FALSE OR s.has_correct_submission IS NULL
    ORDER BY a.assignment_order ASC
    LIMIT 1;`

  if (rows && rows.length > 0) {
    return rows[0].id;
  }

  // all assignments successfully completed
  return false;
}

const hasUserCompleted = async (id, userUuid) => {
  const rows = await sql`SELECT * FROM programming_assignment_submissions 
    WHERE programming_assignment_id = ${id} AND user_uuid = ${userUuid} AND correct;`;

  if (rows && rows.length > 0) {
    return true;
  }

  return false;
}

const findByOrder = async (order) => {
  const rows = await sql`SELECT * FROM programming_assignments WHERE assignment_order = ${order};`;

  if (rows && rows.length > 0) {
    return rows[0];
  }

  return false;
}

export { findAll, findById, getCount, findNextUncompletedForUser, findByOrder, findNextByOrder, hasUserCompleted };
