const { EntitySchema } = require("typeorm");

const Payment = new EntitySchema({
  name: "Payment",
  tableName: "payments",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    amount: {
      type: "decimal",
      precision: 10,
      scale: 2
    },
    paymentDate: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP"
    },
    notes: {
      type: "text",
      nullable: true
    },
    participantId: {
      type: "uuid"
    },
    tripId: {
      type: "uuid"
    },
    collectorId: {
      type: "uuid"
    },
    createdAt: {
      type: "timestamp",
      createDate: true
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true
    }
  },
  relations: {
    participant: {
      type: "many-to-one",
      target: "Participant",
      joinColumn: {
        name: "participantId"
      }
    },
    trip: {
      type: "many-to-one",
      target: "Trip",
      joinColumn: {
        name: "tripId"
      }
    },
    collector: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "collectorId"
      }
    }
  }
});

module.exports = Payment;
