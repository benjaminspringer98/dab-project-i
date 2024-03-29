import { sql } from "../database/database.js";

const findById = async (id) => {
  const rows = await sql`SELECT * FROM programming_assignments WHERE id = ${id};`;

  if (rows && rows.length > 0) {
    return rows[0];
  }

  return false;
}

const findNextUncompletedForUser = async (userUuid) => {
  const rows = await sql`SELECT a.*
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
    return rows[0];
  }

  // all assignments successfully completed
  return false;
}

export { findById, findNextUncompletedForUser };
