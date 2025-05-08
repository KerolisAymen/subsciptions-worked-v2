const { EntitySchema } = require("typeorm");

const Project = new EntitySchema({
  name: "Project",
  tableName: "projects",
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
    ownerId: {
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
    owner: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "ownerId"
      }
    },
    members: {
      type: "one-to-many",
      target: "ProjectMember",
      inverseSide: "project"
    },
    trips: {
      type: "one-to-many",
      target: "Trip",
      inverseSide: "project"
    }
  }
});

module.exports = Project;
