exports.test = [
    {
        name: "wtfBlock",
        objects: [
            { kind: "input", id: 1, type: "int" },
            { kind: "input", id: 2, type: "int" },
            { kind: "block", id: 3, fname: "toInt" },
            { kind: "block", id: 4, fname: "toInt" },
            { kind: "block", id: 5, fname: "add" },
            { kind: "block", id: 6, fname: "toStr" },
            { kind: "output", id: 7, type: "string" }
        ],
        connections: [
            { id: 1, sourceId: 1, sourceEndpoint: 1, targetId: 3, targetEndpoint: 1 },
            { id: 2, sourceId: 2, sourceEndpoint: 1, targetId: 4, targetEndpoint: 1 },
            { id: 2, sourceId: 3, sourceEndpoint: 1, targetId: 5, targetEndpoint: 1 },
            { id: 2, sourceId: 4, sourceEndpoint: 1, targetId: 5, targetEndpoint: 2 },
            { id: 2, sourceId: 5, sourceEndpoint: 1, targetId: 6, targetEndpoint: 1 },
            { id: 2, sourceId: 6, sourceEndpoint: 1, targetId: 7, targetEndpoint: 1 }
        ]
    }
];
