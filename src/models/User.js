const { EntitySchema } = require("typeorm");
const bcrypt = require("bcryptjs");

const User = new EntitySchema({
  name: "User",
  tableName: "users",
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
    email: {
      type: "varchar",
      length: 100,
      unique: true
    },
    password: {
      type: "varchar",
      length: 100
    },
    isSystemAdmin: {
      type: "boolean",
      default: false
    },
    emailVerified: {
      type: "boolean",
      default: false
    },
    verificationToken: {
      type: "varchar",
      length: 100,
      nullable: true
    },
    verificationTokenExpires: {
      type: "timestamp",
      nullable: true
    },
    passwordResetToken: {
      type: "varchar",
      length: 100,
      nullable: true
    },
    passwordResetExpires: {
      type: "timestamp",
      nullable: true
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
    projects: {
      type: "one-to-many",
      target: "ProjectMember",
      inverseSide: "user"
    },
    createdParticipants: {
      type: "one-to-many",
      target: "Participant",
      inverseSide: "createdByUser"
    },
    updatedParticipants: {
      type: "one-to-many",
      target: "Participant",
      inverseSide: "updatedByUser"
    },
    payments: {
      type: "one-to-many",
      target: "Payment",
      inverseSide: "collector"
    }
  }
});

module.exports = User;
