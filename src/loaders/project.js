export const batchProjects = async (keys, models) => {
    const project = await models.Project.find({
      _id: {
        $in: keys,
      },
    });
  
    return keys.map(key => project.find(project => project.id == key));
  };
  