const AppDataSource = require('../config/database');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const User = require('../models/User');

exports.getUserProjects = async (req, res) => {
  try {
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    
    // Find all projects where the user is a member
    const memberships = await projectMemberRepository
      .createQueryBuilder('projectMember')
      .leftJoinAndSelect('projectMember.project', 'project')
      .where('projectMember.userId = :userId', { userId: req.user.id })
      .getMany();
      
    const projects = memberships.map(membership => {
      return {
        ...membership.project,
        role: membership.role
      };
    });

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: {
        projects
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    
    // Create project instance
    const newProject = projectRepository.create({
      name: req.body.name,
      description: req.body.description || null,
      ownerId: req.user.id
    });
    
    // Save the project first
    const savedProject = await projectRepository.save(newProject);
    
    // Then create the project member
    const projectMember = projectMemberRepository.create({
      projectId: savedProject.id,
      userId: req.user.id,
      role: 'owner'
    });
    
    // Save the project member
    await projectMemberRepository.save(projectMember);
    
    res.status(201).json({
      status: 'success',
      data: {
        project: savedProject
      }
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'حدث خطأ أثناء إنشاء المشروع'
    });
  }
};

exports.getProject = async (req, res) => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    
    // Check if user is member of the project
    const membership = await projectMemberRepository.findOne({
      where: {
        projectId: req.params.projectId,
        userId: req.user.id
      }
    });
    
    if (!membership) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this project'
      });
    }
    
    // Get project details
    const project = await projectRepository.findOne({
      where: { id: req.params.projectId }
    });
    
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        project,
        userRole: membership.role
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    
    const project = await projectRepository.findOne({
      where: { id: req.params.projectId }
    });
    
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }
    
    // Update project
    projectRepository.merge(project, {
      name: req.body.name || project.name,
      description: req.body.description || project.description
    });
    
    const updatedProject = await projectRepository.save(project);
    
    res.status(200).json({
      status: 'success',
      data: {
        project: updatedProject
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const projectRepository = AppDataSource.getRepository(Project);
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);

    const project = await projectRepository.findOne({
      where: { id: req.params.projectId }
    });

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Delete all related project members first
    await projectMemberRepository.delete({ projectId: req.params.projectId });

    // Now delete the project
    await projectRepository.remove(project);

    // Return a 200 with a message for consistency
    return res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getProjectMembers = async (req, res) => {
  try {
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    
    const members = await projectMemberRepository
      .createQueryBuilder('projectMember')
      .leftJoinAndSelect('projectMember.user', 'user')
      .where('projectMember.projectId = :projectId', { projectId: req.params.projectId })
      .select(['projectMember.id', 'projectMember.role', 'user.id', 'user.name', 'user.email'])
      .getMany();
      
    res.status(200).json({
      status: 'success',
      results: members.length,
      data: {
        members
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.addProjectMember = async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    
    // Check if user exists
    const user = await userRepository.findOne({
      where: { email: req.body.email }
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if user is already a member
    const existingMember = await projectMemberRepository.findOne({
      where: {
        projectId: req.params.projectId,
        userId: user.id
      }
    });
    
    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already a member of this project'
      });
    }
    
    // Check if role is valid
    const validRoles = ['admin', 'collector'];
    if (!validRoles.includes(req.body.role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be admin or collector'
      });
    }
    
    // Add user as project member
    const projectMember = projectMemberRepository.create({
      projectId: req.params.projectId,
      userId: user.id,
      role: req.body.role
    });
    
    const savedMember = await projectMemberRepository.save(projectMember);
    
    res.status(201).json({
      status: 'success',
      data: {
        member: {
          id: savedMember.id,
          role: savedMember.role,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateProjectMember = async (req, res) => {
  try {
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    
    // Find the member
    const member = await projectMemberRepository.findOne({
      where: { id: req.params.memberId }
    });
    
    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'Member not found'
      });
    }
    
    // Check if owner tries to update their own role
    if (member.role === 'owner') {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot change the role of the project owner'
      });
    }
    
    // Check if role is valid
    const validRoles = ['admin', 'collector'];
    if (!validRoles.includes(req.body.role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be admin or collector'
      });
    }
    
    // Update role
    member.role = req.body.role;
    const updatedMember = await projectMemberRepository.save(member);
    
    res.status(200).json({
      status: 'success',
      data: {
        member: updatedMember
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.removeProjectMember = async (req, res) => {
  try {
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    
    // Find the member
    const member = await projectMemberRepository.findOne({
      where: { id: req.params.memberId }
    });
    
    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'Member not found'
      });
    }
    
    // Check if owner tries to remove themselves
    if (member.role === 'owner') {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot remove the project owner'
      });
    }
    
    await projectMemberRepository.remove(member);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
