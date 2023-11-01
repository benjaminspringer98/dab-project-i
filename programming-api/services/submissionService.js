import { sql } from "../database/database.js";

const add = async (assignmentId, code, userUuid) => {
    await sql`INSERT INTO programming_assignment_submissions (programming_assignment_id, code, user_uuid) VALUES (${assignmentId}, ${code}, ${userUuid});`;
}

const findAllByUserUuid = async (userUuid) => {
    return await sql`SELECT * FROM programming_assignment_submissions WHERE user_uuid = ${userUuid};`;
}

const findCurrentAssignmentByUserUuid = async (userUuid) => {
    const rows = await sql`SELECT * FROM programming_assignment_submissions WHERE user_uuid = ${userUuid} AND correct = true ORDER BY id DESC LIMIT 1;`;

    if (rows && rows.length > 0) {
        return rows[0];
    }

    return false;
}


export { add, findAllByUserUuid, findCurrentAssignmentByUserUuid }