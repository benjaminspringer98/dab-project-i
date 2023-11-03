import { readable } from "svelte/store";

let order = localStorage.getItem("assignmentOrder");

if (!order) {
    order = 0;
    localStorage.setItem("assignmentOrder", order);
}

export const assignmentOrder = readable(order);