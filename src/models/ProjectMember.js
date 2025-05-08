const { EntitySchema } = require("typeorm");

const ProjectMember = new EntitySchema({
  name: "ProjectMember",
  tableName: "project_members",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid"
    },
    projectId: {
      type: "uuid"
    },
    userId: {
      type: "uuid"
    },
    role: {
      type: "enum",
      enum: ["owner", "admin", "collector"]
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
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "userId"
      }
    }
  }
});

module.exports = ProjectMember;
