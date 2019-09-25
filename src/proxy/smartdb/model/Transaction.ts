const Transactions = {
    table: "transactions",
    tableFields: [
        { name: "id", type: "String", length: 64, not_null: true, primary_key: true },
        { name: "blockId", type: "String", length: 64, not_null: true, index: true },
        { name: "type", type: "Number", not_null: true, index: true },
        { name: "timestamp", type: "Number", index: true },
        { name: "senderPublicKey", type: "String", length: 32, not_null: true, index: true },
        { name: "senderId", type: "String", length: 50, not_null: true, index: true },
        { name: "recipientId", type: "String", length: 50, index: true },
        { name: "amount", type: "BigInt", not_null: true },
        { name: "fee", type: "BigInt", not_null: true },
        { name: "signature", type: "String", length: 64, not_null: true, index: true }


    ]
};

export default Transactions;