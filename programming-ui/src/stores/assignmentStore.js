import { writable } from 'svelte/store';

const assignmentId = writable(1);
const assignmentOrder = writable(1);
const totalAssignments = writable(0);

export { assignmentId, assignmentOrder, totalAssignments };