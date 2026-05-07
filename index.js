const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const mainRouter = require('./routes/main.router');

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const { initRepo } = require('./controllers/init');
const { addRepo } = require('./controllers/add');
const { commitRepo } = require('./controllers/commit');
const { pushRepo } = require('./controllers/push');
const { pullRepo } = require('./controllers/pull');
const { revertRepo } = require('./controllers/revert');

dotenv.config();

yargs(hideBin(process.argv))
.command('start', "Starts a new server", {}, startServer)
.command('init', "Initialize a new repository", {}, initRepo)
.command(
    'add <file>', 
    "Add files to the staging area", 
    (yargs) => {
        yargs.positional('file', {
            describe: 'The file to add to the staging area',
            type: 'string'
        });
    }, 
    (argv)=> {
        addRepo(argv.file)
    }
)
.command(
    'commit <message>',
    "Create a new commit",
    (yargs) => {
        yargs.positional('message', {
            describe: 'The commit message',
            type: 'string'
        });
    }, 
    (argv) =>{
        commitRepo(argv.message)
    })
.command('push',"Push commits to S3",{},pushRepo)
.command('pull',"Pull commits from S3",{},pullRepo)
.command(
    'revert <commitID>',
    "Revert to a specific commit",
    (yargs) => {
        yargs.positional('commitID', {
            describe: 'The commit ID to revert to',
            type: 'string'
        });
    },
    (argv) =>{
        revertRepo(argv.commitID)
    }
)
.demandCommand(1, 'You need to specify at least one command')
.help().argv;

function startServer(){
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(bodyParser.json());
    app.use(express.json());

    const mongoURI = process.env.MONGODB_URI;

    mongoose.connect(mongoURI)
    .then(()=>console.log("Connected to MongoDB"))
    .catch((err)=>console.error("MongoDB connection error:", err));

    app.use(cors({ origin: "*" }));

    app.use("/",mainRouter);

    let user = "test";
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        }
    });

    io.on("connection", (socket) => {
        socket.on("JoinRoom",(userID)=>{
            user = userID;
            console.log("=====");
            console.log(user);
            console.log("=====");
            socket.join(userID);
        })
    });

    const db = mongoose.connection;
    db.once("open", async() => {
        console.log("CRUD operations will be performed here");
    });

    httpServer.listen(port,()=>{
        console.log(`Server is running on port ${port}`);
    })
}