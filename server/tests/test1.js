exports.test = {
    objects: [
        { kind: "input", id: 1, type: "string" },
        { kind: "block", id: 2, fname: "duplicate" },
        { kind: "output", id: 3, type: "string" }
    ],
    connections: [
        { id: 1, sourceId: 1, sourceEndpoint: 1, targetId: 2, targetEndpoint: 1 },
        { id: 2, sourceId: 2, sourceEndpoint: 1, targetId: 3, targetEndpoint: 1 }
    ]
};
