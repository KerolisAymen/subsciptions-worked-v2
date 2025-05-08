const { EntitySchema } = require("typeorm");

const Trip = new EntitySchema({
  name: "Trip",
  tableName: "trips",
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
    description: {
      type: "text",
      nullable: true
    },
    startDate: {
      type: "date",
      nullable: true
    },
    endDate: {
      type: "date",
      nullable: true
    },
    totalCost: {
      type: "decimal",
      precision: 10,
      scale: 2,
      default: 0
    },
    expectedAmountPerPerson: {
      type: "decimal",
      precision: 10,
      scale: 2,
      default: 0
    },
    projectId: {
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
    project: {
      type: "many-to-one",
      target: "Project",
      joinColumn: {
        name: "projectId"
      }
    },
    participants: {
      type: "one-to-many",
      target: "Participant",
      inverseSide: "trip"
    },
    payments: {
      type: "one-to-many",
      target: "Payment",
      inverseSide: "trip"
    }
  }
});

module.exports = Trip;
