const getPoints = async (user) => {
    const response = await fetch(`/api/points`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
    });

    const json = await response.json();
    return json.points;
};

export { getPoints }