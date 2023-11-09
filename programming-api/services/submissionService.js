import { sql } from "../database/database.js";

const userHasPendingSubmission = async (userUuid) => {
    const rows = await sql`SELECT status FROM programming_assignment_submissions WHERE user_uuid = ${userUuid} AND status = 'pending';`;

    if (rows && rows.length > 0) {
        return rows[0].status === "pending";
    }

    return false;
}

const add = async (assignmentId, code, userUuid) => {
    const matchingSubmission = await findMatchingSubmission(assignmentId, code);
    let created;
    if (matchingSubmission) {
        // if matching submission found, add new submission with values of matching submission
        created = await sql`INSERT INTO programming_assignment_submissions (programming_assignment_id, code, user_uuid, grader_feedback, status, correct) 
                    VALUES (${assignmentId}, ${code}, ${userUuid}, ${matchingSubmission.grader_feedback}, ${matchingSubmission.status}, ${matchingSubmission.correct})
                    RETURNING id;`;

    } else {
        // if no matching submission found, add new submission with status pending by default
        created = await sql`INSERT INTO programming_assignment_submissions (programming_assignment_id, code, user_uuid) 
                    VALUES (${assignmentId}, ${code}, ${userUuid})
                    RETURNING id;`;
    }

    return created[0].id;
}

const findById = async (id) => {
    const rows = await sql`SELECT * FROM programming_assignment_submissions WHERE id = ${id};`;

    if (rows && rows.length > 0) {
        return rows[0];
    }

    return false;
}

const getStatus = async (id) => {
    const rows = await sql`SELECT status FROM programming_assignment_submissions WHERE id = ${id};`;

    if (rows && rows.length > 0) {
        return rows[0].status;
    }

    return false;
}


const findMatchingSubmission = async (assignmentId, code) => {
    const rows = await sql`SELECT * FROM programming_assignment_submissions 
                            WHERE programming_assignment_id = ${assignmentId} AND code = ${code} AND status = 'processed';`;

    if (rows && rows.length > 0) {
        return rows[0];
    }

    return false;

}

const update = async (id, graderFeedback, isCorrect) => {
    await sql`UPDATE programming_assignment_submissions SET grader_feedback = ${graderFeedback}, status = 'processed', correct = ${isCorrect} WHERE id = ${id};`;
}

const getPoints = async (userUuid) => {
    const rows = await sql`SELECT COUNT(DISTINCT a.id) * 100 AS points
                        FROM programming_assignment_submissions s 
                        JOIN programming_assignments a ON s.programming_assignment_id = a.id 
                        WHERE user_uuid = ${userUuid} AND correct = true;`;
    return rows[0].points;
}

export { add, findById, getStatus, userHasPendingSubmission, findMatchingSubmission, update, getPoints }