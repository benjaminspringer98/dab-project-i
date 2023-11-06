import http from "k6/http";

export const options = {
    duration: "1s",
    vus: 1,
    summaryTrendStats: ["avg", "p(99)"],
};

export default function () {
    const data = {
        user: randomString(10),
        code: randomString(50),
    };
    http.post(
        `http://localhost:7800/api/assignments/1/submissions`,
        JSON.stringify(data)
    );
}

const randomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}