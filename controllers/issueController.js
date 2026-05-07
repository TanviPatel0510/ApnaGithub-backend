const mongoose = require('mongoose');
const Issue = require('../models/issueModel');
const Repository = require('../models/repoModel');
const User = require('../models/userModel');

async function createIssue(req,res){
    const { title, description } = req.body;
    const repoId = req.params.repoId;
    try{
        if(!title || !description){
            return res.status(400).json({error:"Title and description are required"});
        }

        const issue = new Issue({
            title,
            description,
            repository: repoId
        });

        await issue.save();

        res.status(201).json(issue);
    }catch(err){
        console.error("Error creating issue: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}
   
async function updateIssueById(req,res){
    const { id } = req.params;
    const { title, description, status } = req.body;
    try{
        const issue = await Issue.findById(id);

        if(!issue){
            return res.status(404).json({error:"Issue not found"});
        }

        issue.title = title;
        issue.description = description;
        issue.status = status;

        const updatedIssue = await issue.save();
        res.json({
            message: "Issue updated successfully",
            issue: updatedIssue
        });
    }catch(err){
        console.error("Error updating issue: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

async function deleteIssueById(req,res){
    const { id } = req.params;
    try{
        const issue = await Issue.findByIdAndDelete(id);

        if(!issue){
            return res.status(404).json({error:"Issue not found"});
        }

        res.json({message:"Issue deleted successfully"});
    }catch(err){
        console.error("Error deleting issue: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

async function getAllIssues(req,res){
    const repoId = req.params.repoId;

    try{
        const issues = await Issue.find({repository: repoId});

        if(!issues){
            return res.status(404).json({error:"No issues found for this repository"});
        }

        res.status(200).json(issues);
    }catch(err){
        console.error("Error fetching issues: ", err.message);
        res.status(500).send("Internal Server Error");
    }
} 

async function getIssueById(req,res){
    const { id } = req.params;
    try{
        const issue = await Issue.findById(id);

        if(!issue){
            return res.status(404).json({error:"Issue not found"});
        }

        res.json(issue);
    }catch(err){
        console.error("Error fetching issue: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    createIssue,
    updateIssueById,
    deleteIssueById,
    getAllIssues,
    getIssueById
}