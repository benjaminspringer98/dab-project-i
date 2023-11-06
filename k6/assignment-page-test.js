import http from "k6/http";

export const options = {
    duration: "3s",
    vus: 1,
    summaryTrendStats: ["avg", "p(99)"],
};

export default function () {
    http.get("http://localhost:7800/assignments/1");
}