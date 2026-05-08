const mongoose = require('mongoose');
const Repository = require('../models/repoModel');
const User = require('../models/userModel');
const Issue = require('../models/issueModel');

/*async function createRepository(req,res){
    const { owner, name, issues, content, description, visibility } = req.body;
    try{
        if(!name){
            return res.status(400).json({error:"Repository name is required"});
        }

        if(!mongoose.Types.ObjectId.isValid(owner)){
            return res.status(400).json({error:"Invalid Userr ID"});
        }

        const newRepository = new Repository({
            name,
            description,
            visibility,
            owner,
            issues,
            content
        });

        const result = await newRepository.save();
        res.status(201).json({
            message: "Repository created successfully",
            repositoryID: result._id  
        });
        
    }catch(err){
        console.error("Error creating repository: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}*/

async function createRepository(req, res) {
  try {
    const { owner, name, issues, content, description, visibility } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Repository name is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid User ID" });
    }

    const newRepository = new Repository({
      name,
      description,
      visibility: visibility === true || visibility === "true", // 🔥 FIX
      owner,
      issues,
      content
    });

    const result = await newRepository.save();

    res.status(201).json({
      message: "Repository created successfully",
      repository: result
    });

  } catch (err) {
    console.error("Error creating repository: ", err.message);
    res.status(500).send("Internal Server Error");
  }
}

//Only fetches public repos to show in suggested repos
async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({
      visibility: true
    })
    .populate("owner")
    .populate("issues");

    res.json(repositories);

  } catch (err) {
    console.error("Error fetching repositories:", err.message);
    res.status(500).send("Internal Server Error");
  }
}

/*async function getAllRepositories(req,res){
    try{

        //Here we have used mongoose so we can directly apply find() method on Repository model instead of using native mongodb driver 
        //and then applying find() method on collection as we did in userController.js because in userController.js we have used native mongodb to connect to database.
        const repositories = await Repository.find({})
        .populate("owner")
        .populate("issues");

        //In above code we used populate to get all the details about owner(user) and issues instead of only id of it
        //Now populate will provide username email password repos starredRepos and followedUsers of owner and title description status and repository of issues instead of only id of it.
        res.json(repositories);

    }catch(err){
        console.error("Error fetching repositories: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}*/

async function fetchRepositoryById(req,res){
    const repoId = req.params.id;
    try{
        
        const repository = await Repository.find({_id: repoId})
        .populate("owner")
        .populate("issues");

        if(!repository){
            return res.status(404).json({error:"Repository not found"});
        }

        res.json(repository);
    }catch(err){
        console.error("Error fetching repository by ID: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

async function fetchRepositoryByName(req,res){
    const repoName = req.params.name;
    try{
        const repository = await Repository.find({name: repoName})
        .populate("owner")
        .populate("issues");
        
        if(!repository){
            return res.status(404).json({error:"Repository not found"});
        }
        res.json(repository);
    }catch(err){
        console.error("Error fetching repository by name: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

async function fetchRepositoriesForCurrentUser(req,res){
    const userId = req.params.userID;
    try{
        const repositories = await Repository.find({ owner: new mongoose.Types.ObjectId(userId) });
      
        if(!repositories || repositories.length === 0){
            return res.status(404).json({error:"No repositories found for the current user"});
        }

        res.json({ repositories, message: "Repositories fetched for the current user successfully" });
    }catch(err){
        console.error("Error fetching repositories for current user: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

async function updateRepositoryById(req, res) {
    const { id } = req.params;
    const { name, description, content, visibility, userId } = req.body;

    try {
        const repository = await Repository.findById(id);

        if (!repository) {
            return res.status(404).json({ error: "Repository not found" });
        }

        // SECURITY CHECK
        if (repository.owner.toString() !== userId) {
            return res.status(403).json({
                error: "You can only edit your own repositories"
            });
        }

        repository.name = name || repository.name;
        repository.description = description || repository.description;

        if (content) {
            repository.content = content;
        }

        if (visibility !== undefined) {
            repository.visibility = visibility;
        }

        const updatedRepository = await repository.save();

        res.json({
            message: "Repository updated successfully",
            repository: updatedRepository
        });

    } catch (err) {
        console.error("Error updating repository: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

async function toggleVisibilityById(req, res) {
  try {
    const repository = await Repository.findById(req.params.id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository visibility toggled successfully",
      repository: updatedRepository
    });

  } catch (err) {
    console.error("Error toggling repository visibility:", err.message);
    res.status(500).send("Internal Server Error");
  }
}

async function deleteRepositoryById(req,res){
    const { id } = req.params;
    try{
        const repository = await Repository.findByIdAndDelete(id);
        if(!repository){
            return res.status(404).json({error:"Repository not found"});
        }
        res.json({message:"Repository deleted successfully"});
    }catch(err){
        console.error("Error deleting repository: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    createRepository,
    getAllRepositories,
    fetchRepositoryById,
    fetchRepositoryByName,
    fetchRepositoriesForCurrentUser,
    updateRepositoryById,
    toggleVisibilityById,
    deleteRepositoryById
}