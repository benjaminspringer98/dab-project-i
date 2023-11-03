import { sql } from "../database/database.js";

const userHasPendingSubmission = async (userUuid) => {
    const rows = await sql`SELECT status FROM programming_assignment_submissions WHERE user_uuid = ${userUuid} AND status = 'pending';`;

    console.log("rows", rows)
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
        console.log("matchingSubmission:", matchingSubmission);
        created = await sql`INSERT INTO programming_assignment_submissions (programming_assignment_id, code, user_uuid, grader_feedback, status, correct) 
                    VALUES (${assignmentId}, ${code}, ${userUuid}, ${matchingSubmission.grader_feedback}, ${matchingSubmission.status}, ${matchingSubmission.correct})
                    RETURNING id;`;

    } else {
        // if no matching submission found, add new submission with status pending
        console.log("no matching submission found");
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



const findAllByUserUuid = async (userUuid) => {
    return await sql`SELECT * FROM programming_assignment_submissions WHERE user_uuid = ${userUuid};`;
}

const findCurrentAssignmentIdByUserUuid = async (userUuid) => {
    // find id of last correctly submitted assignment
    const rows = await sql`SELECT s.programming_assignment_id, a.assignment_order FROM programming_assignment_submissions s
                            JOIN programming_assignments a ON s.programming_assignment_id = a.id 
                            WHERE s.user_uuid = ${userUuid} AND s.correct = true ORDER BY a.assignment_order DESC LIMIT 1;`;

    if (rows && rows.length > 0) {
        // increment order number of last correct submission to get current assignment
        const orderNumber = Number(rows[0].assignment_order) + 1;
        console.log("orderNumber", orderNumber)

        const row = await sql`SELECT id FROM programming_assignments WHERE assignment_order = ${orderNumber};`
        return row[0].id;
    }

    // if no correct submissions, return id of first assignment
    const firstAssignmentId = await sql`SELECT id FROM programming_assignments WHERE assignment_order = 1;`
    return firstAssignmentId[0].id;
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

export { add, findById, getStatus, userHasPendingSubmission, findAllByUserUuid, findCurrentAssignmentIdByUserUuid, findMatchingSubmission, update }