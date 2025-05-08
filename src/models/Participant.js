const { EntitySchema } = require("typeorm");

const Participant = new EntitySchema({
  name: "Participant",
  tableName: "participants",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    name: {
      type: "varchar",
      length: 100
    },
    phone: {
      type: "varchar",
      length: 20,
      nullable: true
    },
    email: {
      type: "varchar",
      length: 100,
      nullable: true
    },
    tripId: {
      type: "uuid"
    },
    expectedAmount: {
      type: "decimal",
      precision: 10,
      scale: 2,
      default: 0
    },
    createdAt: {
      type: "timestamp",
      createDate: true
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true
    },
    createdBy: {
      type: "uuid",
      nullable: true
    },
    updatedBy: {
      type: "uuid",
      nullable: true
    }
  },
  relations: {
    trip: {
      type: "many-to-one",
      target: "Trip",
      joinColumn: {
        name: "tripId"
      }
    },
    payments: {
      type: "one-to-many",
      target: "Payment",
      inverseSide: "participant"
    },
    createdByUser: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "createdBy"
      },
      nullable: true
    },
    updatedByUser: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "updatedBy"
      },
      nullable: true
    }
  }
});

module.exports = Participant;
