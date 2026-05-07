const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
var ObjectId = require('mongodb').ObjectId;

dotenv.config();
const uri = process.env.MONGODB_URI;

let client;

async function connectClient(){
    if(!client){
        client = new MongoClient(uri);
        await client.connect();
    }
}

async function signup(req,res){
    const { username, email, password } = req.body;
    try{
        await connectClient();
        const db = client.db("githubclone");
        const usersCollection = db.collection("users");

        //check if user alreaduy exists
        const user = await usersCollection.findOne({username: username});
        if(user){
            return res.status(400).json({message:"User already exist!"})
        }

        //10 is no. of times enc. will be performed
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username: username,
            email: email,
            password: hashedPassword,
            repositories: [],
            followedUsers: [],
            starRepos: []
        }

        const result = await usersCollection.insertOne(newUser);

        const token = jwt.sign({userId: result.insertedId}, process.env.JWT_SECRET_KEY, {expiresIn: '1h'});
        res.json({token: token, userId: result.insertedId});
    } catch (err) {
        console.error("Error during signup: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

async function login(req,res){
    const { email, password } = req.body;
    try{
        await connectClient();
        const db = client.db("githubclone");
        const usersCollection = db.collection("users");

        const user = await db.collection("users").findOne({email: email});
        if(!user){
            return res.status(400).json({message:"Invalid email or password!"});
        }

        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid email or password!"});
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET_KEY, {expiresIn: '1h'});
        res.json({token: token, userId: user._id});
    }catch(err){
        console.error("Error during login: ", err.message);
        res.status(500).send("Internal Server Error");
    }

}

async function getAllUsers(req,res){
    try{
        await connectClient();
        const db = client.db("githubclone");
        const usersCollection = db.collection("users");

        const users = await usersCollection.find({}).toArray();
        res.json(users);
    }catch(err){
        console.error("Error fetching users: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

async function getUserProfile(req,res){
    const currentId = req.params.id;
    try{
        await connectClient();
        const db = client.db("githubclone");
        const usersCollection = db.collection("users");

        //Ideally we should compare _id with currentId but since _id is of type 
        //ObjectId and currentId is of type string we need to convert 
        //currentId to ObjectId before comparing
        const user = await usersCollection.findOne({
            _id: new ObjectId(currentId)
        });

        //In above code we used findOne() method instead of findById() method because findById() is a mongoose method and we are using native mongodb driver here.

        if(!user){
            return res.status(404).json({message:"User not found!"});
        }

        res.send(user,{message:"User profile fetched!!"});
    }catch(err){
        console.error("Error fetching user profile: ", err.message);
        res.status(500).send("Internal Server Error");
    }
}

async function updateUserProfile(req,res){

    const currentId = req.params.id;
    const { username, email, password } = req.body;

    try{
        await connectClient();
        const db = client.db("githubclone");
        const usersCollection = db.collection("users");

        let updateFields = { username, email };

        if(password){
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateFields.password = hashedPassword;
        }

        const result = await usersCollection.findOneAndUpdate(
            {_id: new ObjectId(currentId)}, 
            {$set: updateFields},
            {returnDocument: "after"}
        );
        
        res.status(200).json({
            message:"User profile updated!!"
        });

    }catch(err){
        console.error("Error updating user profile: ", err.message);

        if(err.code === 11000){
            return res.status(400).json({
                message:"Username or Email already exists!"
            });
        }

        res.status(500).send("Internal Server Error"); 
    }
}
async function deleteUserProfile(req,res){
    const currId = req.params.id;
    try{
        await connectClient();
        const db = client.db("githubclone");
        const userCollection = db.collection("users");

        const result = userCollection.findOneAndDelete(
            {_id: new ObjectId(currId)}
        );

        if(result.deleteCount == 0){
            res.status(404).json({message:"User not found!"});
        }

        res.json({message:"User Profile deleted!"});
    }catch(err){
        console.error("Error deleting profile!",err.message);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    getAllUsers,
    signup,
    login,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
}