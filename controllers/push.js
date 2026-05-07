const fs = require('fs').promises;
const path = require('path');
const {s3, s3_BUCKET} = require('../config/aws-config');

async function pushRepo(){
    const repoPath = path.resolve(process.cwd(),".apnaGit");
    const commitsPath = path.join(repoPath,"commits");
    try{
        const commitDirs = await fs.readdir(commitsPath);
        for(const commitDir of commitDirs){
            const commitPath = path.join(commitsPath, commitDir);
            const files = await fs.readdir(commitPath);

            for(const file of files){
                const filePath = path.join(commitPath, file);
                const fileContent = await fs.readFile(filePath);
                const params = {
                    Bucket: s3_BUCKET,
                    Key: `commits/${commitDir}/${file}`,
                    Body: fileContent
                }

                await s3.upload(params).promise();
            }
        }
        console.log("All commits pushed to S3 successfully.");
    }catch(err){
        console.error("Error pushing commits:", err);
    }
}

module.exports = {
    pushRepo
};